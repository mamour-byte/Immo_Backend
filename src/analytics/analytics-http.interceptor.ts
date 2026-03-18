import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request } from 'express';
import { AnalyticsService } from './analytics.service';

type RequestUser = {
  id?: number;
  role?: string;
};

@Injectable()
export class AnalyticsHttpInterceptor implements NestInterceptor {
  constructor(private readonly analytics: AnalyticsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const http = context.switchToHttp();
    const req = http.getRequest<Request & { user?: RequestUser }>();
    const res = http.getResponse<{ statusCode: number }>();
    const startedAt = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          this.captureRequest(context, req, res.statusCode, Date.now() - startedAt);
        },
        error: (error: unknown) => {
          const fallbackStatus = Number((error as { status?: number })?.status) || 500;
          this.captureRequest(context, req, fallbackStatus, Date.now() - startedAt);
        },
      }),
    );
  }

  private captureRequest(
    context: ExecutionContext,
    req: Request & { user?: RequestUser },
    statusCode: number,
    durationMs: number,
  ) {
    const userId = req.user?.id;
    const distinctId = userId ? `user:${userId}` : 'anon:visitor';
    const query = (req.query || {}) as Record<string, unknown>;
    const queryKeys = Object.keys(query).sort();

    const routeTemplate = this.resolveRouteTemplate(req);
    const rentalMode =
      typeof query.rentalMode === 'string' ? query.rentalMode : undefined;

    this.analytics.capture({
      distinctId,
      event: 'api_request_completed',
      properties: {
        method: req.method,
        route: routeTemplate,
        status_code: statusCode,
        duration_ms: durationMs,
        controller: context.getClass().name,
        handler: context.getHandler().name,
        user_role: req.user?.role || 'ANON',
        has_filters: queryKeys.length > 0,
        query_keys: queryKeys.join(','),
        rental_mode: rentalMode || '',
      },
    });
  }

  private resolveRouteTemplate(req: Request) {
    const baseUrl = req.baseUrl || '';
    const routePath =
      req.route && typeof req.route.path === 'string' ? req.route.path : '';
    const combined = `${baseUrl}${routePath}`.trim();
    if (combined) return combined;
    return (req.path || req.originalUrl || '').split('?')[0];
  }
}
