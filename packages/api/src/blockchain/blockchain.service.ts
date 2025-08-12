import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class BlockchainService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async analyzeAddress(network: string, address: string) {
    // Check cache first
    const cacheKey = `blockchain:${network}:${address}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Check database
    let analysis = await this.prisma.blockchainAddress.findUnique({
      where: { network_address: { network: network as any, address } },
    });

    if (!analysis || this.isAnalysisStale(analysis.lastAnalyzedAt)) {
      // Queue for analysis by blockchain service
      await this.queueAddressAnalysis(network, address);
      
      // Return basic info if no analysis exists
      if (!analysis) {
        analysis = {
          network,
          address,
          riskScore: 0,
          riskLevel: 'LOW',
          reputation: {},
          analysis: {},
          associations: [],
          flags: [],
        } as any;
      }
    }

    // Cache result
    await this.redis.set(cacheKey, analysis, 3600); // 1 hour

    return analysis;
  }

  private isAnalysisStale(lastAnalyzed: Date | null): boolean {
    if (!lastAnalyzed) return true;
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    return lastAnalyzed < oneDayAgo;
  }

  private async queueAddressAnalysis(network: string, address: string): Promise<void> {
    await this.redis.sadd('blockchain:analysis:queue', JSON.stringify({ network, address }));
  }
}