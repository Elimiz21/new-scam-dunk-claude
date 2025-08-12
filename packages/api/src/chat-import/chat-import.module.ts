import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { WebsocketModule } from '../websocket/websocket.module';
import { ChatImportController } from './chat-import.controller';
import { ChatImportService } from './services/chat-import.service';
import { FileProcessorService } from './services/file-processor.service';
import { WhatsAppParser } from './parsers/whatsapp.parser';
import { TelegramParser } from './parsers/telegram.parser';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    WebsocketModule,
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        limits: {
          fileSize: configService.get<number>('CHAT_IMPORT_MAX_FILE_SIZE', 100 * 1024 * 1024),
          files: 1,
        },
        fileFilter: (req, file, callback) => {
          const allowedMimeTypes = [
            'text/plain',
            'application/json',
            'application/zip',
            'application/x-zip-compressed',
            'image/png',
            'image/jpeg',
            'image/jpg',
          ];
          
          if (allowedMimeTypes.includes(file.mimetype)) {
            callback(null, true);
          } else {
            callback(new Error(`File type ${file.mimetype} is not supported`), false);
          }
        },
      }),
    }),
  ],
  controllers: [ChatImportController],
  providers: [
    ChatImportService,
    FileProcessorService,
    WhatsAppParser,
    TelegramParser,
  ],
  exports: [ChatImportService],
})
export class ChatImportModule {}