import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreateScanRequest, Scan, ScanFilters } from '@scam-dunk/shared';

@Injectable()
export class ScansService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async createScan(userId: string, data: CreateScanRequest): Promise<Scan> {
    const scan = await this.prisma.scan.create({
      data: {
        userId,
        type: data.type,
        input: data.input as any,
        tags: data.tags || [],
        metadata: {
          createdBy: userId,
          source: 'api',
        },
      },
    });

    // Queue scan for processing
    await this.queueScanProcessing(scan.id);

    return scan as Scan;
  }

  async findById(id: string): Promise<Scan | null> {
    const scan = await this.prisma.scan.findUnique({
      where: { id },
      include: {
        detections: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return scan as Scan;
  }

  async findUserScans(
    userId: string,
    filters?: ScanFilters,
    page = 1,
    limit = 20,
  ): Promise<{ scans: Scan[]; total: number }> {
    const where: any = { userId };

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.createdAt.lte = filters.dateTo;
      }
    }

    const [scans, total] = await Promise.all([
      this.prisma.scan.findMany({
        where,
        include: {
          detections: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.scan.count({ where }),
    ]);

    return { scans: scans as Scan[], total };
  }

  async updateScanStatus(id: string, status: string, result?: any): Promise<Scan> {
    const scan = await this.prisma.scan.findUnique({
      where: { id },
    });

    if (!scan) {
      throw new NotFoundException('Scan not found');
    }

    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (status === 'PROCESSING') {
      updateData.processingStartedAt = new Date();
    }

    if (status === 'COMPLETED' || status === 'FAILED') {
      updateData.processingEndedAt = new Date();
      
      if (scan.processingStartedAt) {
        updateData.processingTime = Date.now() - scan.processingStartedAt.getTime();
      }
      
      if (result) {
        updateData.result = result;
      }
    }

    return this.prisma.scan.update({
      where: { id },
      data: updateData,
    }) as Promise<Scan>;
  }

  private async queueScanProcessing(scanId: string): Promise<void> {
    // Add scan to Redis queue for processing by AI service
    await this.redis.sadd('scan:queue', scanId);
    
    // Publish event for real-time updates
    await this.redis.pub('scan:created', { scanId });
  }
}