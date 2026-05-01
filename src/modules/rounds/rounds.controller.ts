import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { RoundsService } from './rounds.service';
import { CreateRoundDto } from './dto/create-round.dto';
import { UpdateRoundDto } from './dto/update-round.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/UserRole.enum';

@Controller()
export class RoundsController {
  constructor(private readonly roundsService: RoundsService) {}

  @Get('tournaments/:id/rounds')
  findByTournament(@Param('id') id: string) {
    return this.roundsService.findByTournament(Number(id));
  }

  @Post('tournaments/:id/rounds')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  create(@Param('id') id: string, @Body() createRoundDto: CreateRoundDto, @Req() req: Request) {
    return this.roundsService.create(Number(id), createRoundDto, req.user as any);
  }

  @Get('rounds/:id')
  findOne(@Param('id') id: string) {
    return this.roundsService.findOne(+id);
  }

  @Patch('rounds/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  update(@Param('id') id: string, @Body() updateRoundDto: UpdateRoundDto, @Req() req: Request) {
    return this.roundsService.update(+id, updateRoundDto, req.user as any);
  }

  @Delete('rounds/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  remove(@Param('id') id: string, @Req() req: Request) {
    return this.roundsService.remove(+id, req.user as any);
  }
}
