import {BadRequestException, Injectable, NotFoundException} from '@nestjs/common';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import {InjectRepository} from "@nestjs/typeorm";
import {Tournament} from "./entities/tournament.entity";
import {Repository} from "typeorm";
import {TournamentStatus, STATUS_TRANSITIONS} from "./enums/TournamentStatus.enum";
import {UpdateTournamentDto} from "./dto/update-tournament.dto";
import {Team} from "../teams/entities/team.entity";


@Injectable()
export class TournamentsService {
    constructor(
        @InjectRepository(Tournament)
        private readonly tournamentRepository: Repository<Tournament>,
        @InjectRepository(Team)
        private readonly teamRepository: Repository<Team>,
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

        return {
            ...tournament,
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
            start_date: new Date(dto.start_date),
            end_date: new Date(dto.end_date),
            registration_start: new Date(dto.registration_start),
            registration_end: new Date(dto.registration_end),
            teams_limit: dto.teams_limit ?? null,
            rounds_count: dto.rounds_count ?? 1,
            min_team_size: dto.min_team_size ?? 2,
            max_team_size: dto.max_team_size ?? 5,
            status: dto.status ?? TournamentStatus.DRAFT,
            ...(userId ? { created_by: { id: userId } as any, created_by_id: userId } : {}),
        });

        const saved = await this.tournamentRepository.save(tournament);
        return saved.id;
    }

    async update(id: number, dto: UpdateTournamentDto) {
        const result = await this.tournamentRepository.update({ id }, dto);

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
            relations: { captain: true, members: true },
            order: { id: 'ASC' },
        });

        return teams.map((t, index) => ({
            rank: index + 1,
            team_id: t.id,
            team_name: t.name,
            captain: t.captain?.username ?? null,
            members_count: t.members?.length ?? 0,
            city: t.city ?? null,
            school: t.school ?? null,
        }));
    }

    async delete(id: number) {
        const result = await this.tournamentRepository.delete({ id });

        if (result.affected === 0) {
            throw new NotFoundException('Tournament not found');
        }

        return { success: true };
    }
}
