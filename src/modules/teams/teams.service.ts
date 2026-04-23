import {BadRequestException, ConflictException, Injectable, NotFoundException} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from './entities/team.entity';
import {CreateTeamDto} from "./dto/create-team.dto";

@Injectable()
export class TeamsService {
    constructor(
        @InjectRepository(Team) private readonly teamRepo: Repository<Team>,
    ) {}

    async findMyTeams(userId: number): Promise<Team[]> {
        return this.teamRepo.find({
            where: { captain_id: userId },
            relations: ['tournament'],
        });
    }

    async createTeam(dto: CreateTeamDto, user: any) {
        const captainId = user.userId;


        const tournament = await this.teamRepo.findOne({
            where: { id: dto.tournament_id },
        });

        if (!tournament) {
            throw new NotFoundException('Tournament not found');
        }


        const existing = await this.teamRepo.findOne({
            where: {
                name: dto.name,
                tournament_id: dto.tournament_id,
                captain_id: captainId,
            },
        });

        if (existing) {
            throw new ConflictException(
                'You already created a team with this name in this tournament',
            );
        }

        const team = this.teamRepo.create({
            ...dto,
            captain_id: captainId,
        });

        try {
            const saved = await this.teamRepo.save(team);

            return {
                id: saved.id,
                name: saved.name,
                tournament_id: saved.tournament_id,
                captain_id: saved.captain_id,
                created_at: saved.created_at,
            };
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
                throw new ConflictException(
                    'Team with this name already exists for this tournament',
                );
            }

            throw new BadRequestException('Failed to create team');
        }
    }
}
