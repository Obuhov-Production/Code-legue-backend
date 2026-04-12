import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import type { Request, Response } from 'express';

@Injectable()
export class DebugLoggerInterceptor implements NestInterceptor {
    private readonly logger = new Logger('HTTP');

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const req = context.switchToHttp().getRequest<Request>();
        const res = context.switchToHttp().getResponse<Response>();
        const { method, url, body, headers, query, params } = req;
        const start = Date.now();

        const authHeader = headers['authorization'];
        const hasToken = !!authHeader;
        const tokenPreview = hasToken
            ? `Bearer ${authHeader.replace('Bearer ', '').slice(0, 12)}...`
            : 'none';

        console.log('\n' + '━'.repeat(60));
        console.log(`▶ ${method} ${url}`);
        console.log(`  Origin:  ${headers['origin'] || 'none'}`);
        console.log(`  Token:   ${tokenPreview}`);
        if (Object.keys(query).length) console.log(`  Query:   ${JSON.stringify(query)}`);
        if (Object.keys(params).length) console.log(`  Params:  ${JSON.stringify(params)}`);
        if (body && Object.keys(body).length) {
            const sanitized = { ...body };
            if (sanitized.password) sanitized.password = '***';
            console.log(`  Body:    ${JSON.stringify(sanitized)}`);
        }

        return next.handle().pipe(
            tap((responseBody) => {
                const ms = Date.now() - start;
                const status = res.statusCode;
                const statusEmoji = status < 300 ? '✅' : status < 400 ? '↪' : '❌';
                console.log(`${statusEmoji} ${status} ${method} ${url} — ${ms}ms`);
                if (responseBody !== undefined) {
                    const preview = JSON.stringify(responseBody);
                    console.log(`  Response: ${preview.length > 200 ? preview.slice(0, 200) + '...' : preview}`);
                }
                console.log('━'.repeat(60) + '\n');
            }),
            catchError((err) => {
                const ms = Date.now() - start;
                console.log(`❌ ERROR ${method} ${url} — ${ms}ms`);
                console.log(`  Status:  ${err.status || 500}`);
                console.log(`  Message: ${err.message}`);
                if (err.response?.message) {
                    console.log(`  Details: ${JSON.stringify(err.response.message)}`);
                }
                console.log('━'.repeat(60) + '\n');
                return throwError(() => err);
            }),
        );
    }
}
