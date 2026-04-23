import {Body, Controller, Get, Post, Req, UseGuards} from '@nestjs/common';
import type { Request } from 'express';
import { TeamsService } from './teams.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {CreateTeamDto} from "./dto/create-team.dto";

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
}
