import { Test } from '@nestjs/testing';
import { EvaluationController } from './evaluation.controller';
import { EvaluationService } from './evaluation.service';

describe('EvaluationController', () => {
    let controller: EvaluationController;

    const serviceMock = {
        createEvaluation: jest.fn(),
    };

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            controllers: [EvaluationController],
            providers: [
                { provide: EvaluationService, useValue: serviceMock },
            ],
        }).compile();

        controller = module.get(EvaluationController);
        jest.clearAllMocks();
    });

    it('should call service with correct params', async () => {
        serviceMock.createEvaluation.mockResolvedValue({ id: 1 });

        const req = { user: { id: 1, role: 'admin' } };

        const result = await controller.createEvaluation(
            10,
            { total_score: 20 } as any,
            req as any,
        );

        expect(serviceMock.createEvaluation).toHaveBeenCalledWith(
            10,
            { total_score: 20 },
            req.user,
        );

        expect(result).toEqual({ id: 1 });
    });
});