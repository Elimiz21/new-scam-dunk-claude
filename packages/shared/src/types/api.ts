export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description?: string;
  authenticated?: boolean;
  rateLimit?: {
    requests: number;
    window: number; // seconds
  };
}

export interface GraphQLQuery {
  query: string;
  variables?: Record<string, any>;
  operationName?: string;
}

export interface GraphQLResponse<T = any> {
  data?: T;
  errors?: GraphQLError[];
  extensions?: any;
}

export interface GraphQLError {
  message: string;
  locations?: { line: number; column: number }[];
  path?: (string | number)[];
  extensions?: {
    code?: string;
    exception?: any;
  };
}

export interface WebSocketMessage<T = any> {
  type: string;
  payload: T;
  id?: string;
  timestamp?: string;
}

export interface WebSocketEvent {
  event: 'scan_started' | 'scan_progress' | 'scan_completed' | 'scan_failed' | 'user_activity' | 'system_alert';
  data: any;
  userId?: string;
  sessionId?: string;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  statusCode: number;
  timestamp: string;
  requestId: string;
  path: string;
}

export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  services: ServiceHealth[];
  metadata: {
    version: string;
    environment: string;
  };
}

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  lastCheck: string;
  error?: string;
}

export interface ApiMetrics {
  requests: {
    total: number;
    successful: number;
    failed: number;
    rate: number; // requests per second
  };
  responseTime: {
    average: number;
    p50: number;
    p95: number;
    p99: number;
  };
  errors: {
    rate: number;
    byCode: Record<number, number>;
  };
  activeConnections: number;
  uptime: number;
}