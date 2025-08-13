import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TradingAnalysisController } from './trading-analysis.controller';
import { TradingAnalysisService } from './trading-analysis.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { RedisModule } from '../../redis/redis.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    RedisModule,
  ],
  controllers: [TradingAnalysisController],
  providers: [TradingAnalysisService],
  exports: [TradingAnalysisService],
})
export class TradingAnalysisModule {}