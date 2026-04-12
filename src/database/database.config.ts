import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

export const databaseConfig: TypeOrmModuleAsyncOptions = {
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DB_HOST') || 'localhost',
        port: config.get<number>('DB_PORT') || 3306,
        username: config.get<string>('DB_USERNAME') || 'root',
        password: config.get<string>('DB_PASSWORD') || 'password',
        database: config.get<string>('DB_DATABASE') || 'code_league',
        autoLoadEntities: true,
        synchronize: true,
    }),
};