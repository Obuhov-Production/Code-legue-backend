import { Test, TestingModule } from '@nestjs/testing';
import { JuryController } from './jury.controller';
import { JuryService } from './jury.service';
import { EvaluationService } from '../evaluation/evaluation.service';

describe('JuryController', () => {
    let controller: JuryController;

    const mockJuryService = {
        getTournamentsForJury: jest.fn(),
        getSubmissionsForJury: jest.fn(),
        getRoundSubmissions: jest.fn(),
    };

    const mockEvaluationService = {
        createEvaluation: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [JuryController],
            providers: [
                {
                    provide: JuryService,
                    useValue: mockJuryService,
                },
                {
                    provide: EvaluationService,
                    useValue: mockEvaluationService,
                },
            ],
        }).compile();

        controller = module.get<JuryController>(JuryController);

        jest.clearAllMocks();
    });

    describe('getTournaments', () => {
        it('should return tournaments for jury user', async () => {
            const req = {
                user: {
                    userId: 5,
                },
            } as any;

            const result = [{ id: 1, name: 'Tournament' }];

            mockJuryService.getTournamentsForJury.mockResolvedValue(result);

            expect(await controller.getTournaments(req)).toEqual(result);

            expect(mockJuryService.getTournamentsForJury).toHaveBeenCalledWith(5);
        });
    });

    describe('getSubmissions', () => {
        it('should return submissions for jury user', async () => {
            const req = {
                user: {
                    userId: 10,
                },
            } as any;

            const result = [{ id: 1 }];

            mockJuryService.getSubmissionsForJury.mockResolvedValue(result);

            expect(await controller.getSubmissions(req)).toEqual(result);

            expect(mockJuryService.getSubmissionsForJury).toHaveBeenCalledWith(10);
        });
    });

    describe('getRoundSubmissions', () => {
        it('should return round submissions', async () => {
            const req = {
                user: {
                    userId: 3,
                    role: 'jury',
                },
            } as any;

            const result = [{ id: 55 }];

            mockJuryService.getRoundSubmissions.mockResolvedValue(result);

            expect(await controller.getRoundSubmissions(7, req)).toEqual(result);

            expect(mockJuryService.getRoundSubmissions).toHaveBeenCalledWith(
                7,
                req.user,
            );
        });
    });

    describe('evaluateSubmission', () => {
        it('should create evaluation', async () => {
            const dto = {
                total_score: 90,
                comment: 'Good project',
            };

            const req = {
                user: {
                    userId: 2,
                },
            } as any;

            const result = {
                id: 1,
                ...dto,
            };

            mockEvaluationService.createEvaluation.mockResolvedValue(result);

            expect(
                await controller.evaluateSubmission(15, dto as any, req),
            ).toEqual(result);

            expect(
                mockEvaluationService.createEvaluation,
            ).toHaveBeenCalledWith(15, dto, req.user);
        });
    });
});