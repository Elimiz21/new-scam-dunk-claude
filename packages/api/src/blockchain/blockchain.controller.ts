import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { BlockchainService } from './blockchain.service';

@ApiTags('blockchain')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'blockchain', version: '1' })
export class BlockchainController {
  constructor(private blockchainService: BlockchainService) {}

  @Get('analyze/:network/:address')
  async analyzeAddress(
    @Param('network') network: string,
    @Param('address') address: string,
  ) {
    return this.blockchainService.analyzeAddress(network, address);
  }
}