export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    timestamp: string;
    requestId: string;
  };
}

export type SortOrder = 'asc' | 'desc';

export interface SortOptions {
  field: string;
  order: SortOrder;
}

export interface FilterOptions {
  [key: string]: any;
}

export interface QueryOptions {
  page?: number;
  limit?: number;
  sort?: SortOptions;
  filters?: FilterOptions;
  search?: string;
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface RiskScore {
  score: number; // 0-100
  level: RiskLevel;
  confidence: number; // 0-1
  factors: RiskFactor[];
}

export interface RiskFactor {
  type: string;
  description: string;
  impact: number; // -100 to 100
  confidence: number; // 0-1
}

export interface Location {
  country?: string;
  region?: string;
  city?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface ContactInfo {
  email?: string;
  phone?: string;
  website?: string;
  social?: {
    platform: string;
    handle: string;
    verified: boolean;
  }[];
}