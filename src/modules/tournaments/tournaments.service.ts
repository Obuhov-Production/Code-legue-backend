import {Injectable, NotFoundException} from '@nestjs/common';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import {InjectRepository} from "@nestjs/typeorm";
import {Tournament} from "./entities/tournament.entity";
import {Repository} from "typeorm";
import {TournamentStatus} from "./enums/TournamentStatus.enum";
import {UpdateTournamentDto} from "./dto/update-tournament.dto";


@Injectable()
export class TournamentsService {
    constructor(
        @InjectRepository(Tournament)
        private readonly tournamentRepository: Repository<Tournament>,
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

    async create(dto: CreateTournamentDto) {
        const tournament = this.tournamentRepository.create({
            ...dto,
            status: TournamentStatus.DRAFT,
            created_by: { id: dto.created_by_id } as any,
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
        const result = await this.tournamentRepository.update({ id }, { status });

        if (result.affected === 0) {
            throw new NotFoundException('Tournament not found');
        }

        return { success: true };
    }

    async delete(id: number) {
        const result = await this.tournamentRepository.delete({ id });

        if (result.affected === 0) {
            throw new NotFoundException('Tournament not found');
        }

        return { success: true };
    }
}
