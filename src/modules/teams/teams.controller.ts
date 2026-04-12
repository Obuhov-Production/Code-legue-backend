import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { TeamsService } from './teams.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('teams')
export class TeamsController {
    constructor(private readonly teamsService: TeamsService) {}

    @Get('my')
    @UseGuards(JwtAuthGuard)
    getMyTeams(@Req() req: Request) {
        return this.teamsService.findMyTeams((req.user as any).userId);
    }
}
