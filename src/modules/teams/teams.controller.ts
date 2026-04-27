import {Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards} from '@nestjs/common';
import type { Request } from 'express';
import { TeamsService } from './teams.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {CreateTeamDto} from "./dto/create-team.dto";
import {UpdateTeamDto} from "./dto/update-team.dto";

@Controller('teams')
export class TeamsController {
    constructor(private readonly teamsService: TeamsService) {}

    @Get('my')
    @UseGuards(JwtAuthGuard)
    getMyTeams(@Req() req: Request) {
        return this.teamsService.findMyTeams((req.user as any).userId);
    }

    @UseGuards(JwtAuthGuard)
    @Post()
    async createTeam(@Body() dto: CreateTeamDto, @Req() req) {
        return this.teamsService.createTeam(dto, req.user);
    }

    @Get('tournament/:tournamentId')
    getTeamsByTournament(
        @Param('tournamentId', ParseIntPipe) tournamentId: number,
    ) {
        return this.teamsService.getTeamsByTournament(tournamentId);
    }

    @Get(':id')
    getOne(@Param('id', ParseIntPipe) id: number) {
        return this.teamsService.getTeamById(id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    updateTeam(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateTeamDto,
        @Req() req: Request,
    ) {
        return this.teamsService.updateTeam(id, dto, req.user);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    deleteTeam(
        @Param('id', ParseIntPipe) id: number,
        @Req() req: Request,
    ) {
        return this.teamsService.deleteTeam(id, req.user);
    }
}
