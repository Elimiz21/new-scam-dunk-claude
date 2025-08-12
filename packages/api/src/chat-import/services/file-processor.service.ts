import { Injectable, BadRequestException, PayloadTooLargeException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as fileType from 'file-type';
import { ChatPlatform } from '@prisma/client';

export interface FileValidationResult {
  isValid: boolean;
  mimeType: string;
  detectedPlatform?: ChatPlatform;
  errors: string[];
  warnings: string[];
}

export interface ProcessingProgress {
  stage: 'uploading' | 'validating' | 'parsing' | 'analyzing' | 'completed' | 'failed';
  progress: number; // 0-100
  message: string;
  currentStep?: string;
  totalSteps?: number;
  currentStepProgress?: number;
}

export interface ChunkedUploadInfo {
  uploadId: string;
  fileName: string;
  totalSize: number;
  chunkSize: number;
  totalChunks: number;
  uploadedChunks: number;
  tempFilePath: string;
  expiresAt: Date;
}

@Injectable()
export class FileProcessorService {
  private readonly maxFileSize: number;
  private readonly chunkSize: number;
  private readonly tempDir: string;
  private readonly allowedMimeTypes: Set<string>;
  private readonly activeUploads = new Map<string, ChunkedUploadInfo>();

  constructor(private configService: ConfigService) {
    this.maxFileSize = this.configService.get<number>('CHAT_IMPORT_MAX_FILE_SIZE', 100 * 1024 * 1024); // 100MB default
    this.chunkSize = this.configService.get<number>('CHAT_IMPORT_CHUNK_SIZE', 1024 * 1024); // 1MB chunks
    this.tempDir = this.configService.get<string>('TEMP_DIR', '/tmp/chat-imports');
    
    this.allowedMimeTypes = new Set([
      'text/plain',
      'application/json',
      'application/zip',
      'application/x-zip-compressed',
      'image/png',
      'image/jpeg',
      'image/jpg',
    ]);

    // Ensure temp directory exists
    this.ensureTempDirectory();
    
    // Clean up expired uploads periodically
    setInterval(() => this.cleanupExpiredUploads(), 60000); // Every minute
  }

  async validateFile(file: Buffer, fileName: string, declaredMimeType?: string): Promise<FileValidationResult> {
    const result: FileValidationResult = {
      isValid: true,
      mimeType: declaredMimeType || 'application/octet-stream',
      errors: [],
      warnings: [],
    };

    try {
      // Check file size
      if (file.length === 0) {
        result.isValid = false;
        result.errors.push('File is empty');
        return result;
      }

      if (file.length > this.maxFileSize) {
        result.isValid = false;
        result.errors.push(`File size exceeds maximum allowed size of ${this.maxFileSize / (1024 * 1024)}MB`);
        return result;
      }

      // Detect actual file type
      const detectedType = await fileType.fromBuffer(file);
      if (detectedType) {
        result.mimeType = detectedType.mime;
        
        // Check if detected type matches declared type
        if (declaredMimeType && detectedType.mime !== declaredMimeType) {
          result.warnings.push(`Declared MIME type (${declaredMimeType}) doesn't match detected type (${detectedType.mime})`);
        }
      }

      // Validate MIME type
      if (!this.allowedMimeTypes.has(result.mimeType)) {
        result.isValid = false;
        result.errors.push(`File type ${result.mimeType} is not supported`);
        return result;
      }

      // Detect platform based on file extension and content
      result.detectedPlatform = this.detectPlatform(fileName, file, result.mimeType);

      // Additional validation based on file type
      if (result.mimeType === 'application/json') {
        const validationResult = this.validateJsonStructure(file);
        if (!validationResult.isValid) {
          result.errors.push(...validationResult.errors);
          result.warnings.push(...validationResult.warnings);
          result.isValid = false;
        }
      } else if (result.mimeType === 'text/plain') {
        const validationResult = this.validateTextStructure(file);
        if (!validationResult.isValid) {
          result.warnings.push(...validationResult.warnings);
        }
      }

      // Security scan
      const securityResult = await this.performSecurityScan(file, fileName);
      if (!securityResult.isValid) {
        result.isValid = false;
        result.errors.push(...securityResult.errors);
      }
      result.warnings.push(...securityResult.warnings);

    } catch (error) {
      result.isValid = false;
      result.errors.push(`File validation failed: ${error.message}`);
    }

    return result;
  }

  async initializeChunkedUpload(fileName: string, totalSize: number, userId: string): Promise<string> {
    if (totalSize > this.maxFileSize) {
      throw new PayloadTooLargeException(`File size exceeds maximum allowed size of ${this.maxFileSize / (1024 * 1024)}MB`);
    }

    const uploadId = crypto.randomUUID();
    const sanitizedFileName = this.sanitizeFileName(fileName);
    const tempFilePath = path.join(this.tempDir, `${uploadId}_${sanitizedFileName}`);
    const totalChunks = Math.ceil(totalSize / this.chunkSize);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const uploadInfo: ChunkedUploadInfo = {
      uploadId,
      fileName: sanitizedFileName,
      totalSize,
      chunkSize: this.chunkSize,
      totalChunks,
      uploadedChunks: 0,
      tempFilePath,
      expiresAt,
    };

    this.activeUploads.set(uploadId, uploadInfo);

    // Create empty file
    await fs.promises.writeFile(tempFilePath, Buffer.alloc(0));

    return uploadId;
  }

  async uploadChunk(uploadId: string, chunkIndex: number, chunkData: Buffer): Promise<void> {
    const uploadInfo = this.activeUploads.get(uploadId);
    if (!uploadInfo) {
      throw new BadRequestException('Upload session not found or expired');
    }

    if (chunkIndex >= uploadInfo.totalChunks) {
      throw new BadRequestException('Invalid chunk index');
    }

    // Calculate expected chunk size
    const isLastChunk = chunkIndex === uploadInfo.totalChunks - 1;
    const expectedChunkSize = isLastChunk 
      ? uploadInfo.totalSize % uploadInfo.chunkSize || uploadInfo.chunkSize
      : uploadInfo.chunkSize;

    if (chunkData.length !== expectedChunkSize) {
      throw new BadRequestException(`Invalid chunk size. Expected ${expectedChunkSize}, got ${chunkData.length}`);
    }

    // Write chunk to file
    const fileHandle = await fs.promises.open(uploadInfo.tempFilePath, 'r+');
    try {
      const offset = chunkIndex * uploadInfo.chunkSize;
      await fileHandle.write(chunkData, 0, chunkData.length, offset);
    } finally {
      await fileHandle.close();
    }

    uploadInfo.uploadedChunks++;
  }

  async finalizeChunkedUpload(uploadId: string): Promise<Buffer> {
    const uploadInfo = this.activeUploads.get(uploadId);
    if (!uploadInfo) {
      throw new BadRequestException('Upload session not found or expired');
    }

    if (uploadInfo.uploadedChunks !== uploadInfo.totalChunks) {
      throw new BadRequestException(`Upload incomplete. Expected ${uploadInfo.totalChunks} chunks, got ${uploadInfo.uploadedChunks}`);
    }

    // Read the complete file
    const fileBuffer = await fs.promises.readFile(uploadInfo.tempFilePath);

    // Verify file size
    if (fileBuffer.length !== uploadInfo.totalSize) {
      throw new BadRequestException('File size mismatch after assembly');
    }

    // Clean up
    this.activeUploads.delete(uploadId);
    await this.cleanupTempFile(uploadInfo.tempFilePath);

    return fileBuffer;
  }

  async cancelChunkedUpload(uploadId: string): Promise<void> {
    const uploadInfo = this.activeUploads.get(uploadId);
    if (uploadInfo) {
      await this.cleanupTempFile(uploadInfo.tempFilePath);
      this.activeUploads.delete(uploadId);
    }
  }

  getUploadProgress(uploadId: string): { progress: number; isComplete: boolean } | null {
    const uploadInfo = this.activeUploads.get(uploadId);
    if (!uploadInfo) {
      return null;
    }

    const progress = (uploadInfo.uploadedChunks / uploadInfo.totalChunks) * 100;
    const isComplete = uploadInfo.uploadedChunks === uploadInfo.totalChunks;

    return { progress, isComplete };
  }

  generateFileHash(file: Buffer): string {
    return crypto.createHash('sha256').update(file).digest('hex');
  }

  private detectPlatform(fileName: string, file: Buffer, mimeType: string): ChatPlatform | undefined {
    const lowerFileName = fileName.toLowerCase();
    
    // Check file name patterns
    if (lowerFileName.includes('whatsapp')) {
      return ChatPlatform.WHATSAPP;
    }
    
    if (lowerFileName.includes('telegram')) {
      return ChatPlatform.TELEGRAM;
    }

    if (lowerFileName.includes('discord')) {
      return ChatPlatform.DISCORD;
    }

    if (lowerFileName.includes('instagram')) {
      return ChatPlatform.INSTAGRAM;
    }

    // Check content patterns for text files
    if (mimeType === 'text/plain') {
      const content = file.toString('utf-8').slice(0, 2000); // First 2KB
      
      // WhatsApp patterns
      if (content.includes('[') && content.includes(']') && content.includes(':') &&
          /\[\d{1,2}\/\d{1,2}\/\d{4}/.test(content)) {
        return ChatPlatform.WHATSAPP;
      }
    }

    // Check JSON structure for Telegram
    if (mimeType === 'application/json') {
      try {
        const jsonData = JSON.parse(file.toString('utf-8'));
        if (jsonData.type && ['personal_chat', 'private_supergroup', 'public_channel'].includes(jsonData.type)) {
          return ChatPlatform.TELEGRAM;
        }
      } catch {
        // Invalid JSON, ignore
      }
    }

    return undefined;
  }

  private validateJsonStructure(file: Buffer): { isValid: boolean; errors: string[]; warnings: string[] } {
    try {
      const content = file.toString('utf-8');
      const jsonData = JSON.parse(content);

      if (typeof jsonData !== 'object' || jsonData === null) {
        return {
          isValid: false,
          errors: ['JSON file must contain an object'],
          warnings: [],
        };
      }

      return {
        isValid: true,
        errors: [],
        warnings: [],
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`Invalid JSON format: ${error.message}`],
        warnings: [],
      };
    }
  }

  private validateTextStructure(file: Buffer): { isValid: boolean; warnings: string[] } {
    const content = file.toString('utf-8');
    const lines = content.split('\n');
    const warnings: string[] = [];

    // Check for potential encoding issues
    if (content.includes('�')) {
      warnings.push('File may have encoding issues (invalid characters detected)');
    }

    // Check for empty content
    if (lines.every(line => !line.trim())) {
      warnings.push('File appears to be empty or contains only whitespace');
    }

    // Check line count
    if (lines.length < 10) {
      warnings.push('File contains very few lines, may not be a complete chat export');
    }

    return {
      isValid: true,
      warnings,
    };
  }

  private async performSecurityScan(file: Buffer, fileName: string): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for executable file extensions
    const dangerousExtensions = ['.exe', '.bat', '.sh', '.cmd', '.com', '.scr', '.pif'];
    const extension = path.extname(fileName).toLowerCase();
    if (dangerousExtensions.includes(extension)) {
      errors.push(`Dangerous file extension detected: ${extension}`);
    }

    // Check for suspicious file signatures
    const fileSignature = file.slice(0, 10).toString('hex');
    const suspiciousSignatures = [
      '4d5a', // PE executable
      '7f454c46', // ELF executable
      'cafebabe', // Java class file
    ];

    if (suspiciousSignatures.some(sig => fileSignature.startsWith(sig))) {
      errors.push('Suspicious file signature detected');
    }

    // Check file size vs content ratio (potential zip bomb detection)
    if (file.length < 1000 && fileName.endsWith('.zip')) {
      warnings.push('Very small ZIP file detected, may be suspicious');
    }

    // Basic malware patterns (very basic, should be enhanced with proper antivirus)
    const content = file.toString('binary').toLowerCase();
    const malwareKeywords = ['virus', 'trojan', 'malware', 'exploit', 'shellcode'];
    const suspiciousCount = malwareKeywords.filter(keyword => content.includes(keyword)).length;
    
    if (suspiciousCount > 2) {
      warnings.push('File contains multiple suspicious keywords');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private sanitizeFileName(fileName: string): string {
    // Remove path traversal attempts and dangerous characters
    return path.basename(fileName).replace(/[<>:"|?*\x00-\x1f]/g, '_');
  }

  private ensureTempDirectory(): void {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  private async cleanupTempFile(filePath: string): Promise<void> {
    try {
      await fs.promises.unlink(filePath);
    } catch (error) {
      console.warn(`Failed to cleanup temp file ${filePath}:`, error.message);
    }
  }

  private cleanupExpiredUploads(): void {
    const now = new Date();
    const expiredUploads: string[] = [];

    for (const [uploadId, uploadInfo] of this.activeUploads.entries()) {
      if (now > uploadInfo.expiresAt) {
        expiredUploads.push(uploadId);
      }
    }

    expiredUploads.forEach(async (uploadId) => {
      const uploadInfo = this.activeUploads.get(uploadId);
      if (uploadInfo) {
        await this.cleanupTempFile(uploadInfo.tempFilePath);
        this.activeUploads.delete(uploadId);
      }
    });

    if (expiredUploads.length > 0) {
      console.log(`Cleaned up ${expiredUploads.length} expired upload sessions`);
    }
  }
}