import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ContactVerificationController } from './contact-verification.controller';
import { ContactVerificationService } from './contact-verification.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { RedisModule } from '../../redis/redis.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    RedisModule,
  ],
  controllers: [ContactVerificationController],
  providers: [ContactVerificationService],
  exports: [ContactVerificationService],
})
export class ContactVerificationModule {}