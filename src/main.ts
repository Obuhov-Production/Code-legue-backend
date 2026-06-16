import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, RequestMethod } from '@nestjs/common';
import { DebugLoggerInterceptor } from './common/interceptors/debug-logger.interceptor';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as path from 'path';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4000';
    app.enableCors({
        origin: [frontendUrl],
        credentials: true,
    });

    app.setGlobalPrefix('api', {
        exclude: [
            { path: 'auth/google/callback', method: RequestMethod.GET },
            { path: 'auth/discord/callback', method: RequestMethod.GET },
            { path: 'auth/github/callback', method: RequestMethod.GET },
        ],
    });

    // роздаємо статичні файли uploads
    app.useStaticAssets(path.resolve(process.cwd(), 'uploads'), {
        prefix: '/uploads',
    });

    if (process.env.DEBUG_MODE === 'true') {
        app.useGlobalInterceptors(new DebugLoggerInterceptor());
        console.log('\n🐛 DEBUG MODE ON — logging all HTTP requests\n');
    }

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    const port = process.env.PORT || 4001;
    await app.listen(port);
    console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
