import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { EvaluationScoresService } from './evaluation-scores.service';
import { CreateEvaluationScoreDto } from './dto/create-evaluation-score.dto';

@Controller('evaluation-scores')
export class EvaluationScoresController {
  constructor(private readonly evaluationScoresService: EvaluationScoresService) {}

}
