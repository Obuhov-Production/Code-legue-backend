import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tournament } from '../tournaments/entities/tournament.entity';
import { Team } from '../teams/entities/team.entity';
import { TournamentStatus } from '../tournaments/enums/TournamentStatus.enum';

@Injectable()
export class PublicService {
  constructor(
    @InjectRepository(Tournament)
    private readonly tournamentRepo: Repository<Tournament>,
    @InjectRepository(Team)
    private readonly teamRepo: Repository<Team>,
  ) {}

  /** GET /public/tournaments — активні + завершені, без auth */
  async getTournaments() {
    const tournaments = await this.tournamentRepo.find({
      where: [
        { status: TournamentStatus.RUNNING },
        { status: TournamentStatus.REGISTRATION },
        { status: TournamentStatus.FINISHED },
      ],
      relations: { teams: true },
      order: { start_date: 'DESC' },
    });

    return tournaments.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      status: t.status,
      category: t.category,
      format: t.format,
      prize: t.prize,
      start_date: t.start_date,
      end_date: t.end_date,
      registration_start: t.registration_start,
      registration_end: t.registration_end,
      teams_limit: t.teams_limit,
      teams_count: t.teams?.length ?? 0,
    }));
  }

  /** GET /public/leaderboard/:tournamentId — таблиця лідерів */
  async getLeaderboard(tournamentId: number) {
    const tournament = await this.tournamentRepo.findOne({
      where: { id: tournamentId },
    });

    if (!tournament) {
      throw new NotFoundException(`Tournament #${tournamentId} not found`);
    }

    // Sum total_score across all evaluated submissions for each team
    const rows = await this.teamRepo
      .createQueryBuilder('team')
      .leftJoin('team.submissions', 'submission')
      .leftJoin('submission.evaluations', 'evaluation')
      .select('team.id', 'id')
      .addSelect('team.name', 'name')
      .addSelect('team.city', 'city')
      .addSelect('team.school', 'school')
      .addSelect('team.organisation', 'organisation')
      .addSelect('COALESCE(SUM(evaluation.total_score), 0)', 'total_score')
      .addSelect('COUNT(DISTINCT submission.round_id)', 'rounds_submitted')
      .where('team.tournament_id = :tournamentId', { tournamentId })
      .groupBy('team.id')
      .orderBy('total_score', 'DESC')
      .getRawMany();

    return rows.map((row, index) => ({
      rank: index + 1,
      team_id: row.id,
      team_name: row.name,
      city: row.city,
      school: row.school,
      organisation: row.organisation,
      total_score: Number(row.total_score),
      rounds_submitted: Number(row.rounds_submitted),
    }));
  }
}
