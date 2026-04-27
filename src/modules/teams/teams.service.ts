import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from './entities/team.entity';
import {CreateTeamDto} from "./dto/create-team.dto";
import {TeamMember} from "../team-members/entities/team-member.entity";
import {Tournament} from "../tournaments/entities/tournament.entity";
import {TournamentStatus} from "../tournaments/enums/TournamentStatus.enum";

@Injectable()
export class TeamsService {
    constructor(
        @InjectRepository(Team) private readonly teamRepo: Repository<Team>,

        @InjectRepository(TeamMember)
        private readonly memberRepo: Repository<TeamMember>,

        @InjectRepository(Tournament)
        private readonly tournamentRepo: Repository<Tournament>,
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

    async getTeamsByTournament(tournamentId: number) {
        const teams = await this.teamRepo.find({
            where: { tournament_id: tournamentId },
            relations: {
                members: true, // якщо треба глибше → members: { user: true }
            },
            order: {
                created_at: 'DESC',
            },
        });

        return teams.map(team => ({
            id: team.id,
            name: team.name,
            members: team.members,
            city: team.city,
            school: team.school,
        }));
    }

    // ================= GET ONE =================
    async getTeamById(id: number) {
        const team = await this.teamRepo.findOne({
            where: { id },
            relations: {
                members: true,
            },
        });

        if (!team) throw new NotFoundException('Team not found');

        return team;
    }

    // ================= UPDATE =================
    async updateTeam(id: number, dto: any, user: any) {
        const team = await this.teamRepo.findOne({
            where: { id },
            relations: {
                tournament: true,
                members: true,
            },
        });

        if (!team) throw new NotFoundException('Team not found');

        if (team.captain_id !== user.userId) {
            throw new ForbiddenException('Only captain can update team');
        }

        if (
            team.tournament.status === TournamentStatus.RUNNING ||
            team.tournament.status === TournamentStatus.FINISHED
        ) {
            throw new BadRequestException(
                'Cannot update team after tournament start',
            );
        }

        if (dto.name) {
            team.name = dto.name;
        }

        if (dto.members) {
            const min = team.tournament.min_team_size;
            const max = team.tournament.max_team_size;

            if (dto.members.length < min || dto.members.length > max) {
                throw new BadRequestException(
                    `Team size must be between ${min} and ${max}`,
                );
            }

            await this.memberRepo.delete({ team: { id: team.id } });

            const newMembers = dto.members.map((m) =>
                this.memberRepo.create({
                    team,
                    fullName: m.fullName,
                    email: m.email,
                }),
            );

            await this.memberRepo.save(newMembers);
        }

        await this.teamRepo.save(team);

        return { success: true };
    }

    // ================= DELETE =================
    async deleteTeam(id: number, user: any) {
        const team = await this.teamRepo.findOne({
            where: { id },
            relations: {
                tournament: true,
            },
        });

        if (!team) throw new NotFoundException('Team not found');

        if (
            team.captain_id !== user.userId &&
            user.role !== 'admin'
        ) {
            throw new ForbiddenException('No access');
        }

        await this.teamRepo.remove(team);

        return { success: true };
    }


    async getTeamsCount(tournamentId: number) {
        return this.teamRepo.count({
            where: { tournament_id: tournamentId },
        });
    }
}
