import {BadRequestException, Injectable, NotFoundException} from '@nestjs/common';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import {InjectRepository} from "@nestjs/typeorm";
import {Tournament} from "./entities/tournament.entity";
import {Repository} from "typeorm";
import {TournamentStatus, STATUS_TRANSITIONS} from "./enums/TournamentStatus.enum";
import {UpdateTournamentDto} from "./dto/update-tournament.dto";
import {Team} from "../teams/entities/team.entity";
import { JuryAssignment } from '../jury-assignments/entities/jury-assignment.entity';


@Injectable()
export class TournamentsService {
    constructor(
        @InjectRepository(Tournament)
        private readonly tournamentRepository: Repository<Tournament>,
        @InjectRepository(Team)
        private readonly teamRepository: Repository<Team>,
        @InjectRepository(JuryAssignment)
        private readonly juryAssignmentRepository: Repository<JuryAssignment>,
    ) {}

    async getAll(status?: TournamentStatus) {
        const where = status ? { status } : {};

        const tournaments = await this.tournamentRepository.find({
            where,
            relations: {
                created_by: true,
                teams: true,
            },
            order: {
                created_at: 'DESC',
            },
        });

        return tournaments.map((t) => ({
            ...t,
            creator_name: t.created_by?.username,
            teams_count: t.teams?.length ?? 0,
        }));
    }


    async getById(id: number) {
        const tournament = await this.tournamentRepository.findOne({
            where: { id },
            relations: {
                created_by: true,
                teams: true,
            },
        });

        if (!tournament) {
            throw new NotFoundException('Tournament not found');
        }

        const canViewTz =
            tournament.tz_enabled ||
            tournament.status === TournamentStatus.RUNNING ||
            tournament.status === TournamentStatus.FINISHED;

        return {
            ...tournament,
            tz: canViewTz ? tournament.tz : null,
            creator_name: tournament.created_by?.username,
            teams_count: tournament.teams?.length ?? 0,
        };
    }

    async create(dto: CreateTournamentDto, userId?: number) {
        const tournament = this.tournamentRepository.create({
            name: dto.name,
            description: dto.description ?? null,
            rules: dto.rules ?? null,
            category: dto.category ?? null,
            format: dto.format ?? null,
            prize: dto.prize ?? null,
            emoji: dto.emoji ?? null,
            tz: dto.tz ?? null,
            tz_enabled: dto.tz_enabled ?? false,
            start_date: new Date(dto.start_date),
            end_date: new Date(dto.end_date),
            registration_start: new Date(dto.registration_start),
            registration_end: new Date(dto.registration_end),
            teams_limit: dto.teams_limit ?? null,
            rounds_count: dto.rounds_count ?? 1,
            min_team_size: dto.min_team_size ?? 2,
            max_team_size: dto.max_team_size ?? 5,
            elo_participation: dto.elo_participation ?? null,
            elo_per_round: dto.elo_per_round ?? null,
            elo_winner: dto.elo_winner ?? null,
            status: dto.status ?? TournamentStatus.DRAFT,
            ...(userId ? { created_by: { id: userId } as any, created_by_id: userId } : {}),
        });

        const saved = await this.tournamentRepository.save(tournament);
        return saved.id;
    }

    async update(id: number, dto: UpdateTournamentDto) {
        const payload: any = { ...dto };
        if (dto.start_date) payload.start_date = new Date(dto.start_date);
        if (dto.end_date) payload.end_date = new Date(dto.end_date);
        if (dto.registration_start) payload.registration_start = new Date(dto.registration_start);
        if (dto.registration_end) payload.registration_end = new Date(dto.registration_end);

        const result = await this.tournamentRepository.update({ id }, payload);

        if (result.affected === 0) {
            throw new NotFoundException('Tournament not found');
        }

        return { success: true };
    }

    async updateStatus(id: number, status: TournamentStatus) {
        const tournament = await this.tournamentRepository.findOne({ where: { id } });

        if (!tournament) {
            throw new NotFoundException('Tournament not found');
        }

        const allowed = STATUS_TRANSITIONS[tournament.status] ?? [];
        if (!allowed.includes(status)) {
            throw new BadRequestException(
                `Cannot transition from "${tournament.status}" to "${status}". ` +
                `Allowed: [${allowed.join(', ') || 'none'}]`,
            );
        }

        await this.tournamentRepository.update({ id }, { status });
        return { success: true, status };
    }

    async getLeaderboard(tournamentId: number) {
        const tournament = await this.tournamentRepository.findOne({ where: { id: tournamentId } });
        if (!tournament) throw new NotFoundException('Tournament not found');

        const teams = await this.teamRepository.find({
            where: { tournament_id: tournamentId },
            relations: { captain: true, members: true, submissions: { evaluations: true } },
        });

        const ranked = teams.map((t) => {
            let totalScore = 0;
            const criteriaBreakdown: Record<string, number> = {};

            for (const submission of t.submissions ?? []) {
                for (const evaluation of submission.evaluations ?? []) {
                    totalScore += Number(evaluation.total_score || 0);
                    const criteria = (evaluation.criteria || {}) as Record<string, number>;
                    for (const [key, value] of Object.entries(criteria)) {
                        criteriaBreakdown[key] = (criteriaBreakdown[key] ?? 0) + Number(value || 0);
                    }
                }
            }

            return {
                team_id: t.id,
                team_name: t.name,
                captain: t.captain?.username ?? null,
                members_count: t.members?.length ?? 0,
                city: t.city ?? null,
                school: t.school ?? null,
                total_score: totalScore,
                criteria_breakdown: criteriaBreakdown,
            };
        }).sort((a, b) => b.total_score - a.total_score);

        return ranked.map((item, index) => ({
            rank: index + 1,
            ...item,
        }));
    }

    async delete(id: number) {
        const result = await this.tournamentRepository.delete({ id });

        if (result.affected === 0) {
            throw new NotFoundException('Tournament not found');
        }

        return { success: true };
    }

    async getAssignedJury(tournamentId: number) {
        const assignments = await this.juryAssignmentRepository.find({
            relations: {
                jury: true,
                submission: {
                    team: true,
                },
            },
        });

        const juryMap = new Map<number, any>();
        for (const assignment of assignments) {
            if (assignment.submission?.team?.tournament_id !== tournamentId) continue;
            const jury = assignment.jury;
            if (jury && !juryMap.has(jury.id)) {
                juryMap.set(jury.id, {
                    id: jury.id,
                    username: jury.username,
                    email: jury.email,
                    role: jury.role,
                    user_avatar_url: jury.user_avatar_url ?? null,
                });
            }
        }

        return Array.from(juryMap.values());
    }
}
