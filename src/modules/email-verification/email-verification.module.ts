import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { EmailVerification } from './entities/email-verification.entity';
import { User } from '../users/entities/user.entity';
import { EmailVerificationService } from './email-verification.service';

@Module({
    imports: [
        ConfigModule,
        JwtModule.register({}),
        TypeOrmModule.forFeature([EmailVerification, User]),
    ],
    providers: [EmailVerificationService],
    exports:   [EmailVerificationService],
})
export class EmailVerificationModule {}
