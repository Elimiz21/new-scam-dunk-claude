import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChatAnalysisController } from './chat-analysis.controller';
import { ChatAnalysisService } from './chat-analysis.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { RedisModule } from '../../redis/redis.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    RedisModule,
  ],
  controllers: [ChatAnalysisController],
  providers: [ChatAnalysisService],
  exports: [ChatAnalysisService],
})
export class ChatAnalysisModule {}