import bcrypt from 'bcryptjs';
import { prisma } from '../lib/supabase';
import { User } from '@prisma/client';

export class UserService {
  // Create a new user
  static async createUser(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password, 12);
    
    return prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
      },
    });
  }

  // Find user by email
  static async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  // Find user by ID
  static async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  // Verify password
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // Update user
  static async updateUser(id: string, data: Partial<User>): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  // Update last login
  static async updateLastLogin(id: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  // Get user safe data (without password)
  static sanitizeUser(user: User): Omit<User, 'passwordHash' | 'twoFactorSecret' | 'refreshTokens'> {
    const { passwordHash, twoFactorSecret, ...safeUser } = user;
    return safeUser;
  }
}