import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JuryService } from './jury.service';
import { JuryController } from './jury.controller';
import { JuryAssignment } from '../jury-assignments/entities/jury-assignment.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([JuryAssignment]),
        AuthModule,
    ],
    controllers: [JuryController],
    providers: [JuryService],
})
export class JuryModule {}
