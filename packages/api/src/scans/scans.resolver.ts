import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ScansService } from './scans.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateScanRequest } from '../shared/types';

@Resolver('Scan')
@UseGuards(AuthGuard('jwt'))
export class ScansResolver {
  constructor(private scansService: ScansService) {}

  @Query()
  async scans(@CurrentUser() user: any, @Args('filters') filters?: any) {
    return this.scansService.findUserScans(user.id, filters);
  }

  @Query()
  async scan(@Args('id') id: string) {
    return this.scansService.findById(id);
  }

  @Mutation()
  async createScan(@CurrentUser() user: any, @Args('data') data: CreateScanRequest) {
    return this.scansService.createScan(user.id, data);
  }
}