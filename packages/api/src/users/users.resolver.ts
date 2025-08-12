import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Resolver('User')
@UseGuards(AuthGuard('jwt'))
export class UsersResolver {
  constructor(private usersService: UsersService) {}

  @Query()
  async me(@CurrentUser() user: any) {
    return this.usersService.findById(user.id);
  }

  @Query()
  async userStats(@CurrentUser() user: any) {
    return this.usersService.getUserStats(user.id);
  }

  @Mutation()
  async updateProfile(@CurrentUser() user: any, @Args('data') data: any) {
    return this.usersService.updateUser(user.id, data);
  }
}