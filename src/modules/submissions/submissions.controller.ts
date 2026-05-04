import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { SubmissionsService } from './submissions.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';


@Controller('submissions')
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Get('/teams/:teamId')
  @UseGuards(JwtAuthGuard)
  getTeamSubmissions(@Param('teamId', ParseIntPipe) teamId: number, @Req() req: Request) {
    return this.submissionsService.getTeamSubmissions(teamId, req.user as any);
  }

  @Get('/rounds/:roundId/me')
  @UseGuards(JwtAuthGuard)
  getMyRoundSubmission(@Param('roundId', ParseIntPipe) roundId: number, @Req() req: Request) {
    return this.submissionsService.getMyRoundSubmission(roundId, req.user as any);
  }

  @Post('/rounds/:roundId')
  @UseGuards(JwtAuthGuard)
  createForRound(
      @Param('roundId', ParseIntPipe) roundId: number,
      @Body() dto: CreateSubmissionDto,
      @Req() req: Request,
  ) {
    return this.submissionsService.createForRound(roundId, dto, req.user as any);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  updateSubmission(
      @Param('id', ParseIntPipe) id: number,
      @Body() dto: UpdateSubmissionDto,
      @Req() req: Request,
  ) {
    return this.submissionsService.updateSubmission(id, dto, req.user as any);
  }
}
