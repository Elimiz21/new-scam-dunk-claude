import { Module } from '@nestjs/common';
import { ScansService } from './scans.service';
import { ScansController } from './scans.controller';
import { ScansResolver } from './scans.resolver';

@Module({
  providers: [ScansService, ScansResolver],
  controllers: [ScansController],
  exports: [ScansService],
})
export class ScansModule {}