import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JuryAssignment } from '../jury-assignments/entities/jury-assignment.entity';
import { SubmissionsService } from '../submissions/submissions.service';

@Injectable()
export class JuryService {
    constructor(
        @InjectRepository(JuryAssignment)
        private readonly juryAssignmentRepo: Repository<JuryAssignment>,
        private readonly submissionsService: SubmissionsService,
    ) {}

    async getTournamentsForJury(userId: number) {
        const assignments = await this.juryAssignmentRepo.find({
            where: { jury_id: userId },
            relations: {
                submission: {
                    team: {
                        tournament: true,
                    },
                },
            },
        });

        const tournamentMap = new Map<number, object>();
        for (const assignment of assignments) {
            const tournament = assignment.submission?.team?.tournament;
            if (tournament && !tournamentMap.has(tournament.id)) {
                tournamentMap.set(tournament.id, tournament);
            }
        }

        return Array.from(tournamentMap.values());
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
