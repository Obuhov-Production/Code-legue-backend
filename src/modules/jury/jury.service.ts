import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { JuryAssignment } from '../jury-assignments/entities/jury-assignment.entity';
import { Tournament } from '../tournaments/entities/tournament.entity';
import { Submission } from '../submissions/entities/submission.entity';
import { Evaluation } from '../evaluation/entities/evaluation.entity';

@Injectable()
export class JuryService {
    constructor(
        @InjectRepository(JuryAssignment)
        private readonly juryAssignmentRepo: Repository<JuryAssignment>,
        @InjectRepository(Tournament)
        private readonly tournamentRepo: Repository<Tournament>,
        @InjectRepository(Submission)
        private readonly submissionRepo: Repository<Submission>,
        @InjectRepository(Evaluation)
        private readonly evaluationRepo: Repository<Evaluation>,
    ) {}

    async getTournamentsForJury(userId: number) {
        const tournaments = await this.tournamentRepo
            .createQueryBuilder('t')
            .innerJoin('tournament_jury_members', 'tjm', 'tjm.tournament_id = t.id')
            .where('tjm.user_id = :userId', { userId })
            .leftJoinAndSelect('t.rounds', 'rounds')
            .leftJoinAndSelect('rounds.submissions', 'submissions')
            .leftJoinAndSelect('t.teams', 'teams')
            .orderBy('t.created_at', 'DESC')
            .getMany();

        // Count evaluations by this jury per round
        const allRoundIds = tournaments.flatMap(t => (t.rounds ?? []).map(r => r.id));
        let evalCounts: Map<number, number> = new Map();
        if (allRoundIds.length > 0) {
            const rows: { round_id: number; cnt: string }[] = await this.evaluationRepo
                .createQueryBuilder('e')
                .innerJoin('e.submission', 's')
                .select('s.round_id', 'round_id')
                .addSelect('COUNT(e.id)', 'cnt')
                .where('e.jury_id = :userId', { userId })
                .andWhere('s.round_id IN (:...roundIds)', { roundIds: allRoundIds })
                .groupBy('s.round_id')
                .getRawMany();
            evalCounts = new Map(rows.map(r => [Number(r.round_id), Number(r.cnt)]));
        }

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
                my_eval_count: evalCounts.get(r.id) ?? 0,
            })),
        }));
    }

    async getSubmissionsForJury(userId: number) {
        return this.juryAssignmentRepo.find({
            where: { jury_id: userId },
            relations: { submission: { team: true, round: true, evaluations: true } },
        });
    }

    /**
     * Returns submissions for a round, formatted for the jury frontend.
     * For admin — all submissions; for jury — all submissions in tournaments
     * where they are assigned as jury member.
     */
    async getRoundSubmissions(roundId: number, user: any) {
        const isAdmin = String(user?.role || '').includes('admin');
        const userId = user.userId;

        let submissions: Submission[];

        if (isAdmin) {
            submissions = await this.submissionRepo.find({
                where: { round_id: roundId },
                relations: { team: true, evaluations: true },
                order: { updated_at: 'DESC' },
            });
        } else {
            // Verify this jury is assigned to the tournament that owns this round
            const round = await this.submissionRepo.manager
                .getRepository('Round')
                .findOne({ where: { id: roundId } }) as any;
            if (!round) return [];

            const isJury = await this.tournamentRepo
                .createQueryBuilder('t')
                .innerJoin('tournament_jury_members', 'tjm', 'tjm.tournament_id = t.id')
                .where('t.id = :tid', { tid: round.tournament_id })
                .andWhere('tjm.user_id = :userId', { userId })
                .getCount();

            if (!isJury) return [];

            submissions = await this.submissionRepo.find({
                where: { round_id: roundId },
                relations: { team: true, evaluations: true },
                order: { updated_at: 'DESC' },
            });
        }

        // Map to flat objects expected by the frontend
        return submissions.map(s => {
            const myEval = (s.evaluations ?? []).find(e => e.jury_id === userId);
            return {
                id: s.id,
                round_id: s.round_id,
                team_id: s.team_id,
                team_name: s.team?.name ?? '',
                city: s.team?.city ?? null,
                school: s.team?.school ?? null,
                github_url: s.github_repo_url,
                video_url: s.pitch_video_url,
                live_demo_url: s.live_demo_url,
                description: s.description,
                status: s.status,
                submitted_at: s.submitted_at,
                my_evaluation_id: myEval?.id ?? null,
                my_score: myEval?.total_score ?? null,
                my_comment: myEval?.comment ?? null,
                my_criteria_json: myEval?.criteria ? (
                    Array.isArray(myEval.criteria)
                        ? JSON.stringify(myEval.criteria)
                        : JSON.stringify(Object.entries(myEval.criteria).map(([key, score]) => ({ key, label: key, score })))
                ) : null,
            };
        });
    }
}
