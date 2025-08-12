import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import {
  LoginCredentials,
  RegisterCredentials,
  loginCredentialsSchema,
  registerCredentialsSchema,
} from '../shared/types';

@Resolver()
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @Mutation()
  async login(@Args('credentials') credentials: LoginCredentials) {
    const validationResult = loginCredentialsSchema.safeParse(credentials);
    if (!validationResult.success) {
      throw new Error('Invalid input data');
    }
    return this.authService.login(credentials);
  }

  @Mutation()
  async register(@Args('credentials') credentials: RegisterCredentials) {
    const validationResult = registerCredentialsSchema.safeParse(credentials);
    if (!validationResult.success) {
      throw new Error('Invalid input data');
    }
    return this.authService.register(credentials);
  }

  @Mutation()
  async forgotPassword(@Args('email') email: string) {
    await this.authService.forgotPassword(email);
    return { success: true };
  }
}