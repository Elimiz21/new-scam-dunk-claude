import { nanoid } from 'nanoid';

export function generateId(length = 21): string {
  return nanoid(length);
}

export function generateShortId(length = 8): string {
  return nanoid(length);
}

export function generateApiKey(): string {
  return `sd_${nanoid(32)}`;
}

export function generateSessionId(): string {
  return `sess_${nanoid(32)}`;
}

export function hashPassword(password: string): Promise<string> {
  // In a real implementation, this would use bcrypt or similar
  // For now, we'll just return a placeholder
  return Promise.resolve(`hashed_${password}`);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  // In a real implementation, this would use bcrypt or similar
  // For now, we'll just return a placeholder
  return Promise.resolve(hash === `hashed_${password}`);
}

export function generateRandomString(length: number): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
}

export function generateBackupCodes(count = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    codes.push(generateRandomString(8).toUpperCase());
  }
  return codes;
}

export function maskSensitiveData(data: string, visibleChars = 4): string {
  if (data.length <= visibleChars * 2) {
    return '*'.repeat(data.length);
  }
  
  const start = data.slice(0, visibleChars);
  const end = data.slice(-visibleChars);
  const middle = '*'.repeat(Math.max(0, data.length - visibleChars * 2));
  
  return `${start}${middle}${end}`;
}

export function isStrongPassword(password: string): boolean {
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSymbols = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  return hasMinLength && hasUpperCase && hasLowerCase && hasNumbers && hasSymbols;
}

export function calculatePasswordStrength(password: string): {
  score: number;
  level: 'weak' | 'fair' | 'good' | 'strong';
} {
  let score = 0;
  
  // Length
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  
  // Character types
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;
  
  // Patterns
  if (!/(.)\1{2,}/.test(password)) score += 1; // No repeated characters
  if (!/123|abc|qwe/i.test(password)) score += 1; // No common sequences
  
  const levels: Array<'weak' | 'fair' | 'good' | 'strong'> = ['weak', 'fair', 'good', 'strong'];
  const level = levels[Math.min(Math.floor(score / 2), 3)];
  
  return { score, level };
}