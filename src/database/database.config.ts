import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as path from 'path';

export const databaseConfig: TypeOrmModuleAsyncOptions = {
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (config: ConfigService) => ({
        type: 'better-sqlite3',
        database: path.resolve(
            process.cwd(),
            config.get<string>('DB_PATH') || 'db/code_league.sqlite',
        ),
        autoLoadEntities: true,
        synchronize: true,
    }),
};