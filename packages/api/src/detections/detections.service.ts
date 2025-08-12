import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DetectionsService {
  constructor(private prisma: PrismaService) {}

  async findByScanId(scanId: string) {
    return this.prisma.detection.findMany({
      where: { scanId },
      include: {
        feedback: true,
      },
    });
  }

  async createDetection(scanId: string, data: any) {
    return this.prisma.detection.create({
      data: {
        scanId,
        ...data,
      },
    });
  }
}