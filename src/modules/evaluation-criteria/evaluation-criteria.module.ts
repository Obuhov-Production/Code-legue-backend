import { Module } from '@nestjs/common';
import { EvaluationCriteriaService } from './evaluation-criteria.service';
import { EvaluationCriteriaController } from './evaluation-criteria.controller';
import {TypeOrmModule} from "@nestjs/typeorm";
import {EvaluationCriteria} from "./entities/evaluation-criterion.entity";

@Module({
  imports: [TypeOrmModule.forFeature([ EvaluationCriteria ])],
  controllers: [EvaluationCriteriaController],
  providers: [EvaluationCriteriaService],
})
export class EvaluationCriteriaModule {}
