import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Tournament } from '../tournaments/entities/tournament.entity';
import { Team } from '../teams/entities/team.entity';
import { Submission } from '../submissions/entities/submission.entity';

@Injectable()
export class AdminService {
    constructor(
        @InjectRepository(User) private readonly userRepo: Repository<User>,
        @InjectRepository(Tournament) private readonly tournamentRepo: Repository<Tournament>,
        @InjectRepository(Team) private readonly teamRepo: Repository<Team>,
        @InjectRepository(Submission) private readonly submissionRepo: Repository<Submission>,
    ) {}

    async getStats() {
        const [users, tournaments, teams, submissions] = await Promise.all([
            this.userRepo.count(),
            this.tournamentRepo.count(),
            this.teamRepo.count(),
            this.submissionRepo.count(),
        ]);
        return { users, tournaments, teams, submissions };
    }

    async getUsers() {
        return this.userRepo.find({
            select: ['id', 'username', 'email', 'role', 'created_at'],
            order: { created_at: 'DESC' },
        });
    }

    async getMutedUsers() {
        return this.userRepo.find({
            where: { is_chat_muted: true },
            select: ['id', 'username', 'email', 'role'],
        });
    }
}
