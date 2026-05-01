import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Evaluation } from './entities/evaluation.entity';
import { Submission } from '../submissions/entities/submission.entity';
import { JuryAssignment } from '../jury-assignments/entities/jury-assignment.entity';

@Injectable()
export class EvaluationService {
    constructor(
        @InjectRepository(Evaluation) private readonly evaluationRepo: Repository<Evaluation>,
        @InjectRepository(Submission) private readonly submissionRepo: Repository<Submission>,
        @InjectRepository(JuryAssignment) private readonly juryAssignmentRepo: Repository<JuryAssignment>,
    ) {}

    async createEvaluation(submissionId: number, dto: CreateEvaluationDto, user: any) {
        const submission = await this.submissionRepo.findOne({ where: { id: submissionId } });
        if (!submission) {
            throw new NotFoundException('Submission not found');
        }

        const isAdmin = String(user?.role || '').includes('admin');
        if (!isAdmin) {
            const assignment = await this.juryAssignmentRepo.findOne({
                where: { jury_id: user.userId, submission_id: submissionId },
            });
            if (!assignment) {
                throw new ForbiddenException('User is not assigned to evaluate this submission');
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
