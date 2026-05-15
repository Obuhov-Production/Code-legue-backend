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
      emoji: t.emoji,
      format: t.format,
      prize: t.prize,
      tz: t.tz_enabled || t.status === TournamentStatus.RUNNING || t.status === TournamentStatus.FINISHED ? t.tz : null,
      rounds_count: t.rounds_count,
      min_team_size: t.min_team_size,
      max_team_size: t.max_team_size,
      elo_participation: t.elo_participation,
      elo_per_round: t.elo_per_round,
      elo_winner: t.elo_winner,
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
    const teams = await this.teamRepo.find({
      where: { tournament_id: tournamentId },
      relations: {
        submissions: {
          evaluations: true,
        },
      },
    });

    const rows = teams.map((team) => {
      let totalScore = 0;
      const criteriaBreakdown: Record<string, number> = {};

      for (const submission of team.submissions ?? []) {
        for (const evaluation of submission.evaluations ?? []) {
          totalScore += Number(evaluation.total_score || 0);
          this.addCriteriaBreakdown(criteriaBreakdown, evaluation.criteria);
        }
      }

      return {
        team_id: team.id,
        team_name: team.name,
        city: team.city,
        school: team.school,
        organisation: team.organisation,
        total_score: totalScore,
        criteria_breakdown: criteriaBreakdown,
      };
    }).sort((a, b) => b.total_score - a.total_score);

    return rows.map((row, index) => ({
      rank: index + 1,
      ...row,
    }));
  }

  private addCriteriaBreakdown(target: Record<string, number>, rawCriteria: unknown) {
    for (const item of this.normalizeCriteria(rawCriteria)) {
      target[item.label] = (target[item.label] ?? 0) + item.score;
    }
  }

  private normalizeCriteria(rawCriteria: unknown): Array<{ label: string; score: number }> {
    if (!rawCriteria) return [];

    let criteria = rawCriteria;
    if (typeof criteria === 'string') {
      try {
        criteria = JSON.parse(criteria);
      } catch {
        return [];
      }
    }

    if (Array.isArray(criteria)) {
      return criteria
        .map((item, index) => this.normalizeCriterionItem(String(index), item))
        .filter((item): item is { label: string; score: number } => item !== null);
    }

    if (typeof criteria === 'object') {
      return Object.entries(criteria as Record<string, unknown>)
        .map(([key, value]) => this.normalizeCriterionItem(key, value))
        .filter((item): item is { label: string; score: number } => item !== null);
    }

    return [];
  }

  private normalizeCriterionItem(key: string, value: unknown): { label: string; score: number } | null {
    if (value && typeof value === 'object') {
      const item = value as Record<string, unknown>;
      const rawScore = item.score ?? item.value ?? item.total ?? 0;
      const score = Number(rawScore);
      if (!Number.isFinite(score)) return null;
      const label = String(item.label ?? item.key ?? key).trim();
      return { label: label || key, score };
    }

    const score = Number(value);
    if (!Number.isFinite(score)) return null;
    return { label: key, score };
  }
}
