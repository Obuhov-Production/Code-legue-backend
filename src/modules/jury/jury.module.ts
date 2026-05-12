import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JuryService } from './jury.service';
import { JuryController } from './jury.controller';
import { JuryAssignment } from '../jury-assignments/entities/jury-assignment.entity';
import { Tournament } from '../tournaments/entities/tournament.entity';
import { AuthModule } from '../auth/auth.module';
import { SubmissionsModule } from '../submissions/submissions.module';
import { EvaluationModule } from '../evaluation/evaluation.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([JuryAssignment, Tournament]),
        AuthModule,
        SubmissionsModule,
        EvaluationModule,
    ],
    controllers: [JuryController],
    providers: [JuryService],
})
export class JuryModule {}
