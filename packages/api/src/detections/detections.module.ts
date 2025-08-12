import { Module } from '@nestjs/common';
import { DetectionsService } from './detections.service';
import { DetectionsController } from './detections.controller';

@Module({
  providers: [DetectionsService],
  controllers: [DetectionsController],
  exports: [DetectionsService],
})
export class DetectionsModule {}