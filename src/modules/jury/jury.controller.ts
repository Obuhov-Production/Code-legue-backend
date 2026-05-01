import { Body, Controller, Get, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JuryService } from './jury.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EvaluationService } from '../evaluation/evaluation.service';
import { CreateEvaluationDto } from '../evaluation/dto/create-evaluation.dto';

@Controller('jury')
@UseGuards(JwtAuthGuard)
export class JuryController {
    constructor(
        private readonly juryService: JuryService,
        private readonly evaluationService: EvaluationService,
    ) {}

    @Get('tournaments')
    getTournaments(@Req() req: Request) {
        const user = req.user as { id: number };
        return this.juryService.getTournamentsForJury(user.id);
    }

    @Get('submissions')
    getSubmissions(@Req() req: Request) {
        const user = req.user as { id: number };
        return this.juryService.getSubmissionsForJury(user.id);
    }

    @Get('rounds/:roundId/submissions')
    getRoundSubmissions(@Param('roundId', ParseIntPipe) roundId: number, @Req() req: Request) {
        return this.juryService.getRoundSubmissions(roundId, req.user as any);
    }

    @Post('submissions/:submissionId/evaluate')
    evaluateSubmission(
        @Param('submissionId', ParseIntPipe) submissionId: number,
        @Body() dto: CreateEvaluationDto,
        @Req() req: Request,
    ) {
        return this.evaluationService.createEvaluation(submissionId, dto, req.user as any);
    }
}
