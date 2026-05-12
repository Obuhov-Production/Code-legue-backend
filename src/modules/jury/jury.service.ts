import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JuryAssignment } from '../jury-assignments/entities/jury-assignment.entity';
import { Tournament } from '../tournaments/entities/tournament.entity';
import { SubmissionsService } from '../submissions/submissions.service';

@Injectable()
export class JuryService {
    constructor(
        @InjectRepository(JuryAssignment)
        private readonly juryAssignmentRepo: Repository<JuryAssignment>,
        @InjectRepository(Tournament)
        private readonly tournamentRepo: Repository<Tournament>,
        private readonly submissionsService: SubmissionsService,
    ) {}

    async getTournamentsForJury(userId: number) {
        const tournaments = await this.tournamentRepo
            .createQueryBuilder('t')
            .innerJoin('t.jury_members', 'jm', 'jm.id = :userId', { userId })
            .leftJoinAndSelect('t.rounds', 'rounds')
            .leftJoinAndSelect('rounds.submissions', 'submissions')
            .leftJoinAndSelect('t.teams', 'teams')
            .orderBy('t.created_at', 'DESC')
            .getMany();

        return tournaments.map(t => ({
            id: t.id,
            name: t.name,
            status: t.status,
            start_date: t.start_date,
            end_date: t.end_date,
            team_count: t.teams?.length ?? 0,
            round_count: t.rounds?.length ?? 0,
            rounds: (t.rounds ?? []).map(r => ({
                id: r.id,
                title: r.title,
                submission_count: r.submissions?.length ?? 0,
                my_eval_count: 0,
            })),
        }));
    }

    async getSubmissionsForJury(userId: number) {
        return this.juryAssignmentRepo.find({
            where: { jury_id: userId },
            relations: { submission: { team: true, round: true, evaluations: true } },
        });
    }

    async getRoundSubmissions(roundId: number, user: any) {
        return this.submissionsService.getAssignedRoundSubmissions(roundId, user);
    }
}
