import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VeracityCheckingController } from './veracity-checking.controller';
import { VeracityCheckingService } from './veracity-checking.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { RedisModule } from '../../redis/redis.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    RedisModule,
  ],
  controllers: [VeracityCheckingController],
  providers: [VeracityCheckingService],
  exports: [VeracityCheckingService],
})
export class VeracityCheckingModule {}