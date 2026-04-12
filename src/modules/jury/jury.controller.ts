import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JuryService } from './jury.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('jury')
@UseGuards(JwtAuthGuard)
export class JuryController {
    constructor(private readonly juryService: JuryService) {}

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
}
