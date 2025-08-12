import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, UpdateUserRequest } from '../shared/types';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        scans: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async updateUser(id: string, data: UpdateUserRequest): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.delete({
      where: { id },
    });
  }

  async getUserStats(id: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        scans: true,
        _count: {
          select: {
            scans: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const completedScans = user.scans.filter(scan => scan.status === 'COMPLETED');
    const scamsDetected = completedScans.filter(scan => {
      const result = scan.result as any;
      return result?.riskScore?.level === 'high' || result?.riskScore?.level === 'critical';
    }).length;

    return {
      totalScans: user._count.scans,
      completedScans: completedScans.length,
      scamsDetected,
      joinedAt: user.createdAt,
    };
  }
}