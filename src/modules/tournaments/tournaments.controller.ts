import {Controller, Get, Post, Body, Patch, Param, Delete, Query, Req, UseGuards} from '@nestjs/common';
import type { Request } from 'express';
import { TournamentsService } from './tournaments.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import {UpdateTournamentDto} from "./dto/update-tournament.dto";
import {TournamentStatus} from "./enums/TournamentStatus.enum";
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';


@Controller('tournaments')
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @Get()
  getAll(@Query('status') status?: TournamentStatus) {
    return this.tournamentsService.getAll(status);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.tournamentsService.getById(Number(id));
  }

  @Get(':id/leaderboard')
  getLeaderboard(@Param('id') id: string) {
    return this.tournamentsService.getLeaderboard(Number(id));
  }

  @Get(':id/jury')
  getAssignedJury(@Param('id') id: string) {
    return this.tournamentsService.getAssignedJury(Number(id));
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateTournamentDto, @Req() req: Request) {
    const userId = (req.user as any)?.userId;
    return this.tournamentsService.create(dto, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() dto: UpdateTournamentDto, @Req() req: Request) {
    return this.tournamentsService.update(Number(id), dto, req.user as any);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  delete(@Param('id') id: string, @Req() req: Request) {
    return this.tournamentsService.delete(Number(id), req.user as any);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  updateStatus(
      @Param('id') id: string,
      @Body('status') status: TournamentStatus,
      @Req() req: Request,
  ) {
    return this.tournamentsService.updateStatus(Number(id), status, req.user as any);
  }
}
