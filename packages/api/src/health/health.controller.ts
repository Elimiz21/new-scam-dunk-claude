import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@ApiTags('health')
@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  @Get()
  async healthCheck() {
    const services = [];

    // Check database
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      services.push({
        name: 'database',
        status: 'healthy',
        lastCheck: new Date().toISOString(),
      });
    } catch (error) {
      services.push({
        name: 'database',
        status: 'unhealthy',
        lastCheck: new Date().toISOString(),
        error: error.message,
      });
    }

    // Check Redis
    try {
      await this.redis.set('health:check', 'ok', 10);
      await this.redis.get('health:check');
      services.push({
        name: 'redis',
        status: 'healthy',
        lastCheck: new Date().toISOString(),
      });
    } catch (error) {
      services.push({
        name: 'redis',
        status: 'unhealthy',
        lastCheck: new Date().toISOString(),
        error: error.message,
      });
    }

    const allHealthy = services.every(service => service.status === 'healthy');

    return {
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services,
      metadata: {
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      },
    };
  }
}