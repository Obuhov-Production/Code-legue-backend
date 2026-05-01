import { Body, Controller, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { EvaluationService } from './evaluation.service';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('evaluation')
export class EvaluationController {
  constructor(private readonly evaluationService: EvaluationService) {}

  @Post('submissions/:submissionId/evaluate')
  @UseGuards(JwtAuthGuard)
  createEvaluation(
      @Param('submissionId', ParseIntPipe) submissionId: number,
      @Body() dto: CreateEvaluationDto,
      @Req() req: Request,
  ) {
      return this.evaluationService.createEvaluation(submissionId, dto, req.user as any);
  }
}
