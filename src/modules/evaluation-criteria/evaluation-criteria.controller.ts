import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { EvaluationCriteriaService } from './evaluation-criteria.service';
import { CreateEvaluationCriterionDto } from './dto/create-evaluation-criterion.dto';

@Controller('evaluation-criteria')
export class EvaluationCriteriaController {
  constructor(private readonly evaluationCriteriaService: EvaluationCriteriaService) {}

}
