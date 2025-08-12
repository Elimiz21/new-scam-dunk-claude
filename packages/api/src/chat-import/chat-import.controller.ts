import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Query,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  ParseIntPipe,
  BadRequestException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ChatImportService } from './services/chat-import.service';
import { FileProcessorService } from './services/file-processor.service';
import { CreateChatImportDto, InitializeUploadDto, UploadChunkDto, FinalizeUploadDto } from './dto/create-chat-import.dto';

@Controller('chat-import')
@UseGuards(JwtAuthGuard, ThrottlerGuard)
export class ChatImportController {
  constructor(
    private readonly chatImportService: ChatImportService,
    private readonly fileProcessorService: FileProcessorService
  ) {}

  /**
   * Initialize a chunked file upload session
   */
  @Post('initialize')
  async initializeUpload(
    @CurrentUser('id') userId: string,
    @Body() dto: InitializeUploadDto
  ) {
    try {
      const uploadId = await this.fileProcessorService.initializeChunkedUpload(
        dto.fileName,
        dto.totalSize,
        userId
      );

      return {
        success: true,
        data: {
          uploadId,
          chunkSize: 1024 * 1024, // 1MB chunks
          totalChunks: Math.ceil(dto.totalSize / (1024 * 1024)),
        },
      };
    } catch (error) {
      if (error instanceof PayloadTooLargeException) {
        throw error;
      }
      throw new BadRequestException(`Failed to initialize upload: ${error.message}`);
    }
  }

  /**
   * Upload a file chunk
   */
  @Post('upload-chunk/:uploadId/:chunkIndex')
  @UseInterceptors(FileInterceptor('chunk'))
  async uploadChunk(
    @Param('uploadId') uploadId: string,
    @Param('chunkIndex', ParseIntPipe) chunkIndex: number,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string
  ) {
    if (!file || !file.buffer) {
      throw new BadRequestException('No file chunk provided');
    }

    try {
      await this.fileProcessorService.uploadChunk(uploadId, chunkIndex, file.buffer);

      const progress = this.fileProcessorService.getUploadProgress(uploadId);
      
      return {
        success: true,
        data: {
          uploadId,
          chunkIndex,
          progress: progress?.progress || 0,
          isComplete: progress?.isComplete || false,
        },
      };
    } catch (error) {
      throw new BadRequestException(`Failed to upload chunk: ${error.message}`);
    }
  }

  /**
   * Finalize upload and start processing
   */
  @Post('finalize')
  async finalizeUpload(
    @CurrentUser('id') userId: string,
    @Body() dto: FinalizeUploadDto
  ) {
    try {
      // Finalize the chunked upload
      const fileBuffer = await this.fileProcessorService.finalizeChunkedUpload(dto.uploadId);
      
      // Create chat import record
      const chatImportId = await this.chatImportService.createChatImport({
        userId,
        fileName: dto.uploadId, // This will be replaced with actual filename
        fileSize: fileBuffer.length,
        platform: dto.platform,
      });

      // Start processing asynchronously
      this.chatImportService.processUploadedFile(chatImportId, fileBuffer, {
        language: dto.language,
        timezone: dto.timezone,
        extractEntities: true,
        parseAttachments: true,
        validateStructure: true,
        extractMetadata: true,
      }).catch(error => {
        console.error(`Failed to process chat import ${chatImportId}:`, error);
      });

      return {
        success: true,
        data: {
          chatImportId,
          status: 'PROCESSING',
          message: 'File upload completed. Processing started.',
        },
      };
    } catch (error) {
      // Clean up failed upload
      try {
        await this.fileProcessorService.cancelChunkedUpload(dto.uploadId);
      } catch {
        // Ignore cleanup errors
      }
      throw new BadRequestException(`Failed to finalize upload: ${error.message}`);
    }
  }

  /**
   * Upload a complete file (for smaller files)
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB for direct upload
    },
  }))
  async uploadFile(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CreateChatImportDto
  ) {
    if (!file || !file.buffer) {
      throw new BadRequestException('No file provided');
    }

    try {
      // Validate file
      const validationResult = await this.fileProcessorService.validateFile(
        file.buffer,
        file.originalname,
        file.mimetype
      );

      if (!validationResult.isValid) {
        throw new BadRequestException(`File validation failed: ${validationResult.errors.join(', ')}`);
      }

      // Create chat import record
      const chatImportId = await this.chatImportService.createChatImport({
        userId,
        fileName: file.originalname,
        fileSize: file.size,
        platform: body.platform || validationResult.detectedPlatform,
      });

      // Start processing asynchronously
      this.chatImportService.processUploadedFile(chatImportId, file.buffer, {
        extractEntities: true,
        parseAttachments: true,
        validateStructure: true,
        extractMetadata: true,
      }).catch(error => {
        console.error(`Failed to process chat import ${chatImportId}:`, error);
      });

      return {
        success: true,
        data: {
          chatImportId,
          status: 'PROCESSING',
          message: 'File uploaded successfully. Processing started.',
          warnings: validationResult.warnings,
        },
      };
    } catch (error) {
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Cancel a chunked upload
   */
  @Delete('upload/:uploadId')
  async cancelUpload(
    @Param('uploadId') uploadId: string,
    @CurrentUser('id') userId: string
  ) {
    try {
      await this.fileProcessorService.cancelChunkedUpload(uploadId);
      return {
        success: true,
        message: 'Upload cancelled successfully',
      };
    } catch (error) {
      throw new BadRequestException(`Failed to cancel upload: ${error.message}`);
    }
  }

  /**
   * Get upload progress
   */
  @Get('upload/:uploadId/progress')
  getUploadProgress(
    @Param('uploadId') uploadId: string,
    @CurrentUser('id') userId: string
  ) {
    const progress = this.fileProcessorService.getUploadProgress(uploadId);
    
    if (!progress) {
      throw new BadRequestException('Upload session not found or expired');
    }

    return {
      success: true,
      data: progress,
    };
  }

  /**
   * Get processing status
   */
  @Get('status/:id')
  async getStatus(
    @Param('id') chatImportId: string,
    @CurrentUser('id') userId: string
  ) {
    try {
      const status = await this.chatImportService.getChatImportStatus(chatImportId);
      return {
        success: true,
        data: status,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to get status: ${error.message}`);
    }
  }

  /**
   * Get processing results
   */
  @Get('results/:id')
  async getResults(
    @Param('id') chatImportId: string,
    @CurrentUser('id') userId: string
  ) {
    try {
      const results = await this.chatImportService.getChatImportResults(chatImportId, userId);
      return {
        success: true,
        data: results,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to get results: ${error.message}`);
    }
  }

  /**
   * Get user's chat imports
   */
  @Get('list')
  async getUserChatImports(
    @CurrentUser('id') userId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
    @Query('offset', new ParseIntPipe({ optional: true })) offset = 0
  ) {
    try {
      const result = await this.chatImportService.getUserChatImports(userId, limit, offset);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to get chat imports: ${error.message}`);
    }
  }

  /**
   * Delete a chat import
   */
  @Delete(':id')
  async deleteChatImport(
    @Param('id') chatImportId: string,
    @CurrentUser('id') userId: string
  ) {
    try {
      await this.chatImportService.deleteChatImport(chatImportId, userId);
      return {
        success: true,
        message: 'Chat import deleted successfully',
      };
    } catch (error) {
      throw new BadRequestException(`Failed to delete chat import: ${error.message}`);
    }
  }

  /**
   * Get supported platforms and file formats
   */
  @Get('supported-formats')
  getSupportedFormats() {
    return {
      success: true,
      data: {
        platforms: [
          {
            platform: 'WHATSAPP',
            name: 'WhatsApp',
            formats: ['.txt', '.zip'],
            maxSize: '50MB',
            description: 'WhatsApp chat export files (with or without media)',
          },
          {
            platform: 'TELEGRAM',
            name: 'Telegram',
            formats: ['.json'],
            maxSize: '100MB',
            description: 'Telegram chat export in JSON format',
          },
          {
            platform: 'DISCORD',
            name: 'Discord',
            formats: ['.json'],
            maxSize: '100MB',
            description: 'Discord chat logs (via DiscordChatExporter)',
            status: 'Coming Soon',
          },
          {
            platform: 'INSTAGRAM',
            name: 'Instagram',
            formats: ['.png', '.jpg', '.jpeg'],
            maxSize: '50MB',
            description: 'Instagram chat screenshots (OCR processing)',
            status: 'Coming Soon',
          },
        ],
        maxFileSize: '100MB',
        chunkSize: '1MB',
        supportedMimeTypes: [
          'text/plain',
          'application/json',
          'application/zip',
          'image/png',
          'image/jpeg',
        ],
      },
    };
  }

  /**
   * Get chat analysis summary
   */
  @Get(':id/analysis')
  async getAnalysisSummary(
    @Param('id') chatImportId: string,
    @CurrentUser('id') userId: string
  ) {
    try {
      const results = await this.chatImportService.getChatImportResults(chatImportId, userId);
      
      return {
        success: true,
        data: {
          id: results.id,
          platform: results.platform,
          summary: results.summary,
          riskLevel: results.riskLevel,
          overallRiskScore: results.overallRiskScore,
          keyFindings: results.keyFindings,
          statistics: {
            messageCount: results.messageCount,
            participantCount: results.participantCount,
            dateRange: results.dateRange,
            processingTime: results.processingTime,
          },
          participants: results.participants.map(p => ({
            name: p.name,
            messageCount: p.messageCount,
            riskScore: p.riskScore,
            riskFlags: p.riskFlags.slice(0, 3), // Top 3 risk flags
          })),
        },
      };
    } catch (error) {
      throw new BadRequestException(`Failed to get analysis: ${error.message}`);
    }
  }
}