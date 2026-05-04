import { Module } from '@nestjs/common';
import { EvaluationService } from './evaluation.service';
import { EvaluationController } from './evaluation.controller';
import {TypeOrmModule} from "@nestjs/typeorm";
import {Evaluation} from "./entities/evaluation.entity";
import { Submission } from '../submissions/entities/submission.entity';
import { JuryAssignment } from '../jury-assignments/entities/jury-assignment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Evaluation, Submission, JuryAssignment])],
  controllers: [EvaluationController],
  providers: [EvaluationService],
  exports: [EvaluationService],
})
export class EvaluationModule {}
