import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const requestId = uuidv4();
    
    return next.handle().pipe(
      map((data) => {
        // Don't wrap GraphQL responses or file uploads
        const request = context.switchToHttp().getRequest();
        if (request?.url?.includes('/graphql') || context.getType() === 'ws') {
          return data;
        }

        // Check if data is already wrapped (for some edge cases)
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        return {
          success: true,
          data,
          metadata: {
            timestamp: new Date().toISOString(),
            requestId,
          },
        };
      }),
    );
  }
}