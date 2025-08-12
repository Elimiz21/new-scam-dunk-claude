import { IsString, IsNumber, IsOptional, IsEnum, Min, Max } from 'class-validator';
import { ChatPlatform } from '@prisma/client';

export class CreateChatImportDto {
  @IsString()
  fileName: string;

  @IsNumber()
  @Min(1)
  @Max(100 * 1024 * 1024) // 100MB max
  fileSize: number;

  @IsOptional()
  @IsEnum(ChatPlatform)
  platform?: ChatPlatform;
}

export class InitializeUploadDto {
  @IsString()
  fileName: string;

  @IsNumber()
  @Min(1)
  @Max(100 * 1024 * 1024) // 100MB max
  totalSize: number;
}

export class UploadChunkDto {
  @IsString()
  uploadId: string;

  @IsNumber()
  @Min(0)
  chunkIndex: number;
}

export class FinalizeUploadDto {
  @IsString()
  uploadId: string;

  @IsOptional()
  @IsEnum(ChatPlatform)
  platform?: ChatPlatform;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}