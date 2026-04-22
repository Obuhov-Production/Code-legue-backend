import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { PublicService } from './public.service';

@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  /** GET /api/public/tournaments */
  @Get('tournaments')
  getTournaments() {
    return this.publicService.getTournaments();
  }

  /** GET /api/public/leaderboard/:tournamentId */
  @Get('leaderboard/:tournamentId')
  getLeaderboard(@Param('tournamentId', ParseIntPipe) tournamentId: number) {
    return this.publicService.getLeaderboard(tournamentId);
  }
}
