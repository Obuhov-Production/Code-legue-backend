import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Evaluation } from './entities/evaluation.entity';
import { Submission } from '../submissions/entities/submission.entity';
import { JuryAssignment } from '../jury-assignments/entities/jury-assignment.entity';
import { Tournament } from '../tournaments/entities/tournament.entity';

@Injectable()
export class EvaluationService {
    constructor(
        @InjectRepository(Evaluation) private readonly evaluationRepo: Repository<Evaluation>,
        @InjectRepository(Submission) private readonly submissionRepo: Repository<Submission>,
        @InjectRepository(JuryAssignment) private readonly juryAssignmentRepo: Repository<JuryAssignment>,
    ) {}

    async createEvaluation(submissionId: number, dto: CreateEvaluationDto, user: any) {
        const submission = await this.submissionRepo.findOne({
            where: { id: submissionId },
            relations: { round: true },
        });
        if (!submission) {
            throw new NotFoundException('Submission not found');
        }

        const isAdmin = String(user?.role || '').includes('admin');
        if (!isAdmin) {
            // Check if user is jury for the tournament that owns this submission's round
            const tournamentId = submission.round?.tournament_id;
            if (!tournamentId) {
                throw new ForbiddenException('Cannot determine tournament for this submission');
            }

            const isJury = await this.submissionRepo.manager
                .getRepository(Tournament)
                .createQueryBuilder('t')
                .innerJoin('tournament_jury_members', 'tjm', 'tjm.tournament_id = t.id')
                .where('t.id = :tid', { tid: tournamentId })
                .andWhere('tjm.user_id = :userId', { userId: user.userId })
                .getCount();

            if (!isJury) {
                throw new ForbiddenException('User is not assigned as jury for this tournament');
            }
        }

        let evaluation = await this.evaluationRepo.findOne({
            where: { submission_id: submissionId, jury_id: user.userId },
        });

        if (!evaluation) {
            evaluation = this.evaluationRepo.create({
                submission_id: submissionId,
                jury_id: user.userId,
            });
        }

        evaluation.total_score = dto.total_score;
        evaluation.comment = dto.comment ?? null;
        evaluation.criteria = dto.criteria ?? null;

        return this.evaluationRepo.save(evaluation);
    }
}
