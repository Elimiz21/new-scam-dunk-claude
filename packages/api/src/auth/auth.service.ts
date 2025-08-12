import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { EmailService } from '../email/email.service';
import { generateId } from '@scam-dunk/shared';

import {
  LoginCredentials,
  RegisterCredentials,
  AuthTokens,
  AuthSession,
  JWTPayload,
} from '@scam-dunk/shared';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    private redis: RedisService,
    private emailService: EmailService,
  ) {}

  async register(credentials: RegisterCredentials): Promise<AuthSession> {
    const { email, password, firstName, lastName } = credentials;

    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
      },
    });

    // Send verification email
    await this.sendVerificationEmail(user.email);

    // Generate session
    const session = await this.createSession(user);

    return session;
  }

  async login(credentials: LoginCredentials): Promise<AuthSession> {
    const { email, password } = credentials;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate session
    const session = await this.createSession(user);

    return session;
  }

  async logout(userId: string, sessionId: string): Promise<void> {
    // Revoke refresh token
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        token: { contains: sessionId },
      },
      data: {
        revoked: true,
      },
    });

    // Delete session
    await this.prisma.session.deleteMany({
      where: {
        userId,
        sessionToken: sessionId,
      },
    });

    // Clear Redis session
    await this.redis.del(`session:${sessionId}`);
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    // Find refresh token
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Generate new tokens
    const tokens = await this.generateTokens(storedToken.user);

    // Revoke old refresh token
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    });

    return tokens;
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists
      return;
    }

    // Generate reset token
    const resetToken = generateId(32);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour

    // Store in Redis
    await this.redis.set(
      `password-reset:${resetToken}`,
      { userId: user.id, email: user.email },
      3600, // 1 hour
    );

    // Send reset email
    await this.emailService.sendPasswordResetEmail(user.email, resetToken);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Get token data from Redis
    const tokenData = await this.redis.get(`password-reset:${token}`);
    if (!tokenData) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update user password
    await this.prisma.user.update({
      where: { id: tokenData.userId },
      data: { passwordHash },
    });

    // Delete reset token
    await this.redis.del(`password-reset:${token}`);

    // Revoke all refresh tokens for security
    await this.prisma.refreshToken.updateMany({
      where: { userId: tokenData.userId },
      data: { revoked: true },
    });
  }

  async verifyEmail(token: string): Promise<void> {
    // Get token data from Redis
    const tokenData = await this.redis.get(`email-verification:${token}`);
    if (!tokenData) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    // Update user
    await this.prisma.user.update({
      where: { id: tokenData.userId },
      data: { emailVerified: true },
    });

    // Delete verification token
    await this.redis.del(`email-verification:${token}`);
  }

  async resendVerification(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    await this.sendVerificationEmail(user.email);
  }

  private async createSession(user: any): Promise<AuthSession> {
    const sessionId = generateId();
    const tokens = await this.generateTokens(user);

    // Create session in database
    await this.prisma.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        sessionToken: sessionId,
        deviceInfo: {}, // This would be populated from request headers
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    // Store session in Redis
    await this.redis.set(
      `session:${sessionId}`,
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      86400, // 24 hours
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
      },
      tokens,
      sessionId,
    };
  }

  private async generateTokens(user: any): Promise<AuthTokens> {
    const payload: JWTPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      sessionId: generateId(),
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 15 * 60, // 15 minutes
    };

    const accessToken = this.jwtService.sign(payload);

    // Generate refresh token
    const refreshToken = generateId(64);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    // Store refresh token
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutes
      tokenType: 'Bearer',
    };
  }

  private async sendVerificationEmail(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) return;

    // Generate verification token
    const verificationToken = generateId(32);
    
    // Store in Redis
    await this.redis.set(
      `email-verification:${verificationToken}`,
      { userId: user.id, email: user.email },
      86400, // 24 hours
    );

    // Send verification email
    await this.emailService.sendVerificationEmail(email, verificationToken);
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (user && await bcrypt.compare(password, user.passwordHash)) {
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async validateJwtPayload(payload: JWTPayload): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}