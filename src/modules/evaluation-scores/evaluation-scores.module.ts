import { Module } from '@nestjs/common';
import { EvaluationScoresService } from './evaluation-scores.service';
import { EvaluationScoresController } from './evaluation-scores.controller';
import {TypeOrmModule} from "@nestjs/typeorm";
import {EvaluationScore} from "./entities/evaluation-score.entity";

@Module({
  imports: [TypeOrmModule.forFeature([ EvaluationScore ])],
  controllers: [EvaluationScoresController],
  providers: [EvaluationScoresService],
})
export class EvaluationScoresModule {}
