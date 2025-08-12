import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { DetectionsService } from './detections.service';

@ApiTags('detections')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'detections', version: '1' })
export class DetectionsController {
  constructor(private detectionsService: DetectionsService) {}

  @Get('scan/:scanId')
  async getDetectionsByScan(@Param('scanId') scanId: string) {
    return this.detectionsService.findByScanId(scanId);
  }
}