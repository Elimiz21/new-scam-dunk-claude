import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ScansService } from './scans.service';
import { CreateScanRequest, ScanFilters } from '../shared/types';

@ApiTags('scans')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'scans', version: '1' })
export class ScansController {
  constructor(private scansService: ScansService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new scan' })
  async createScan(@Req() req: any, @Body() data: CreateScanRequest) {
    return this.scansService.createScan(req.user.id, data);
  }

  @Get()
  @ApiOperation({ summary: 'Get user scans' })
  async getScans(
    @Req() req: any,
    @Query() filters: ScanFilters,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.scansService.findUserScans(req.user.id, filters, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get scan by ID' })
  async getScan(@Param('id') id: string) {
    return this.scansService.findById(id);
  }
}