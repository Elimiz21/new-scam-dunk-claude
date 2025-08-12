import { z } from 'zod';
import { emailSchema, passwordSchema } from './common';

export const userRoleSchema = z.enum(['user', 'admin', 'moderator']);

export const loginCredentialsSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  rememberMe: z.boolean().optional(),
});

export const registerCredentialsSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: passwordSchema,
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and conditions',
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const forgotPasswordRequestSchema = z.object({
  email: emailSchema,
});

export const resetPasswordRequestSchema = z.object({
  token: z.string().min(1),
  newPassword: passwordSchema,
  confirmPassword: passwordSchema,
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const changePasswordRequestSchema = z.object({
  currentPassword: passwordSchema,
  newPassword: passwordSchema,
  confirmPassword: passwordSchema,
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
}).refine(data => data.currentPassword !== data.newPassword, {
  message: 'New password must be different from current password',
  path: ['newPassword'],
});

export const authTokensSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresIn: z.number().positive(),
  tokenType: z.string().default('Bearer'),
});

export const authSessionSchema = z.object({
  user: z.object({
    id: z.string(),
    email: emailSchema,
    firstName: z.string(),
    lastName: z.string(),
    role: userRoleSchema,
    avatar: z.string().url().optional(),
    emailVerified: z.boolean(),
  }),
  tokens: authTokensSchema,
  sessionId: z.string(),
});

export const jwtPayloadSchema = z.object({
  sub: z.string(), // user id
  email: emailSchema,
  role: userRoleSchema,
  sessionId: z.string(),
  iat: z.number(),
  exp: z.number(),
});

export const refreshTokenRequestSchema = z.object({
  refreshToken: z.string().min(1),
});

export const verifyEmailRequestSchema = z.object({
  token: z.string().min(1),
});

export const resendVerificationRequestSchema = z.object({
  email: emailSchema,
});