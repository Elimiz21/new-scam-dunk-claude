// Shared types for the API service

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  bio?: string;
  website?: string;
  location?: any;
  timezone?: string;
  language?: string;
  currency?: string;
}

export interface CreateScanRequest {
  type: string;
  content: string;
  metadata?: any;
}

export interface Scan {
  id: string;
  userId: string;
  type: string;
  status: string;
  content: string;
  riskScore?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScanFilters {
  userId?: string;
  type?: string;
  status?: string;
  fromDate?: Date;
  toDate?: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  newPassword?: string; // For backward compatibility
}

export interface VerifyEmailRequest {
  token: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  sessionId?: string;
  iat?: number;
  exp?: number;
}

// Additional types for auth
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
}

export interface AuthSession {
  user: User;
  tokens: AuthTokens;
}

export interface ResendVerificationRequest {
  email: string;
}

// Validation schemas (simplified - in real app would use zod)
export const loginCredentialsSchema = {
  safeParse: (data: any) => ({ success: true, data })
};

export const registerCredentialsSchema = {
  safeParse: (data: any) => ({ success: true, data })
};

// Utility functions
export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}