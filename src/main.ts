import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DebugLoggerInterceptor } from './common/interceptors/debug-logger.interceptor';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    app.enableCors({
        origin: [frontendUrl],
        credentials: true,
    });

    app.setGlobalPrefix('api');

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

    const port = process.env.PORT || 3001;
    await app.listen(port);
    console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
