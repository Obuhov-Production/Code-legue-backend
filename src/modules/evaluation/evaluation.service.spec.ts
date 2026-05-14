import { Test } from '@nestjs/testing';
import { EvaluationService } from './evaluation.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Evaluation } from './entities/evaluation.entity';
import { Submission } from '../submissions/entities/submission.entity';
import { JuryAssignment } from '../jury-assignments/entities/jury-assignment.entity';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('EvaluationService', () => {
    let service: EvaluationService;

    const evaluationRepo = {
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
    };

    const submissionRepo = {
        findOne: jest.fn(),
        manager: {
            getRepository: jest.fn(),
        },
    };

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [
                EvaluationService,
                { provide: getRepositoryToken(Evaluation), useValue: evaluationRepo },
                { provide: getRepositoryToken(Submission), useValue: submissionRepo },
                { provide: getRepositoryToken(JuryAssignment), useValue: {} },
            ],
        }).compile();

        service = module.get(EvaluationService);

        jest.clearAllMocks();
    });

    const user = { id: 1, role: 'user' };

    // helper щоб не копіпастити QB
    const createQB = (count: number) => ({
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(count),
    });

    it('should throw if submission not found', async () => {
        submissionRepo.findOne.mockResolvedValue(null);

        await expect(
            service.createEvaluation(1, { total_score: 10 } as any, user),
        ).rejects.toThrow(NotFoundException);
    });

    it('should allow admin to create evaluation', async () => {
        submissionRepo.findOne.mockResolvedValue({
            id: 1,
            round: { tournament_id: 5 },
        });

        evaluationRepo.findOne.mockResolvedValue(null);

        evaluationRepo.create.mockReturnValue({
            submission_id: 1,
            jury_id: 1,
        });

        evaluationRepo.save.mockResolvedValue({
            id: 1,
            submission_id: 1,
            jury_id: 1,
            total_score: 10,
        });

        const result = await service.createEvaluation(
            1,
            { total_score: 10, comment: 'ok' } as any,
            { id: 1, role: 'admin' },
        );

        expect(evaluationRepo.save).toHaveBeenCalled();
        expect(result.total_score).toBe(10);
    });

    it('should forbid non-jury user', async () => {
        submissionRepo.findOne.mockResolvedValue({
            id: 1,
            round: { tournament_id: 10 },
        });

        const qb = createQB(0);

        submissionRepo.manager.getRepository.mockReturnValue({
            createQueryBuilder: jest.fn().mockReturnValue(qb),
        });

        await expect(
            service.createEvaluation(
                1,
                { total_score: 10 } as any,
                { id: 1, role: 'user' },
            ),
        ).rejects.toThrow(ForbiddenException);
    });

    it('should allow jury user to evaluate', async () => {
        submissionRepo.findOne.mockResolvedValue({
            id: 1,
            round: { tournament_id: 10 },
        });

        const qb = createQB(1);

        submissionRepo.manager.getRepository.mockReturnValue({
            createQueryBuilder: jest.fn().mockReturnValue(qb),
        });

        evaluationRepo.findOne.mockResolvedValue(null);

        evaluationRepo.create.mockReturnValue({
            submission_id: 1,
            jury_id: 1,
        });

        evaluationRepo.save.mockResolvedValue({
            id: 1,
            total_score: 15,
        });

        const result = await service.createEvaluation(
            1,
            { total_score: 15 } as any,
            { id: 1, role: 'user' },
        );

        expect(result.total_score).toBe(15);
    });
});