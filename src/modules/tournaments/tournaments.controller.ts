import {Controller, Get, Post, Body, Patch, Param, Delete, Query} from '@nestjs/common';
import { TournamentsService } from './tournaments.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import {UpdateTournamentDto} from "./dto/update-tournament.dto";
import {TournamentStatus} from "./enums/TournamentStatus.enum";


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

  @Post()
  create(@Body() dto: CreateTournamentDto) {
    return this.tournamentsService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTournamentDto) {
    return this.tournamentsService.update(Number(id), dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.tournamentsService.delete(Number(id));
  }

  @Patch(':id/status')
  updateStatus(
      @Param('id') id: string,
      @Body('status') status: TournamentStatus,
  ) {
    return this.tournamentsService.updateStatus(Number(id), status);
  }
}
