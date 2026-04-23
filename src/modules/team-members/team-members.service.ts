import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException
} from '@nestjs/common';
import {InjectRepository} from "@nestjs/typeorm";
import {TeamMember} from "./entities/team-member.entity";
import {Repository} from "typeorm";
import {Team} from "../teams/entities/team.entity";
import {AddTeamMemberDto} from "./dto/add-team-member.dto";

@Injectable()
export class TeamMembersService {
    constructor(
        @InjectRepository(TeamMember)
        private readonly memberRepo: Repository<TeamMember>,

        @InjectRepository(Team)
        private readonly teamRepo: Repository<Team>,
    ) {}

    async addMember(dto: AddTeamMemberDto, user: any) {
        const { team_id, fullName, email } = dto;

        const team = await this.teamRepo.findOne({
            where: { id: team_id },
            relations: { tournament: true },
        });

        if (!team) {
            throw new NotFoundException('Team not found');
        }

        const tournament = team.tournament;

        if (team.captain_id !== user.userId) {
            throw new ForbiddenException('Only captain can add members');
        }

        const emailNormalized = email.trim().toLowerCase();


        if (user.email && emailNormalized === user.email.toLowerCase()) {
            throw new ConflictException('Captain cannot be added as a member');
        }

        const existing = await this.memberRepo.findOne({
            where: {
                email: emailNormalized,
                tournament: { id: tournament.id },
            },
        });

        if (existing) {
            throw new ConflictException(
                'This email is already participating in this tournament',
            );
        }

        const count = await this.memberRepo.count({
            where: { team: { id: team_id } },
        });

        if (count >= tournament.max_team_size) {
            throw new ConflictException(
                `Team is full. Max size is ${tournament.max_team_size}`,
            );
        }

        const member = this.memberRepo.create({
            fullName: fullName.trim(),
            email: emailNormalized,
            team,
            tournament,
        });

        try {
            const saved = await this.memberRepo.save(member);

            return {
                id: saved.id,
                fullName: saved.fullName,
                email: saved.email,
                team_id: team.id,
                tournament_id: tournament.id,
                createdAt: saved.createdAt,
            };
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
                throw new ConflictException(
                    'This email is already participating in this tournament',
                );
            }

            throw new BadRequestException('Failed to add member');
        }
    }


}
