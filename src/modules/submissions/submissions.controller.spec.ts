import { Test, TestingModule } from '@nestjs/testing';

import { SubmissionsController } from './submissions.controller';
import { SubmissionsService } from './submissions.service';

describe('SubmissionsController', () => {
    let controller: SubmissionsController;

    const mockService = {
        getDailyStats: jest.fn(),
        getTeamSubmissions: jest.fn(),
        getMyRoundSubmission: jest.fn(),
        createForRound: jest.fn(),
        updateSubmission: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [SubmissionsController],
            providers: [
                {
                    provide: SubmissionsService,
                    useValue: mockService,
                },
            ],
        }).compile();

        controller = module.get(SubmissionsController);

        jest.clearAllMocks();
    });

    describe('getDailyStats', () => {
        it('should clamp days between 1 and 90', async () => {
            const result = [{ date: '2026-01-01', count: 0 }];

            mockService.getDailyStats.mockResolvedValue(result);

            expect(await controller.getDailyStats('999')).toEqual(result);

            expect(mockService.getDailyStats).toHaveBeenCalledWith(90);
        });

        it('should default to 7 days', async () => {
            mockService.getDailyStats.mockResolvedValue([]);

            await controller.getDailyStats(undefined);

            expect(mockService.getDailyStats).toHaveBeenCalledWith(7);
        });
    });

    describe('getTeamSubmissions', () => {
        it('should return team submissions', async () => {
            const req = { user: { userId: 1 } } as any;

            mockService.getTeamSubmissions.mockResolvedValue([{ id: 1 }]);

            const result = await controller.getTeamSubmissions(5, req);

            expect(result).toEqual([{ id: 1 }]);

            expect(mockService.getTeamSubmissions).toHaveBeenCalledWith(5, req.user);
        });
    });

    describe('getMyRoundSubmission', () => {
        it('should return my submission', async () => {
            const req = { user: { userId: 2 } } as any;

            mockService.getMyRoundSubmission.mockResolvedValue({ id: 10 });

            const result = await controller.getMyRoundSubmission(3, req);

            expect(result).toEqual({ id: 10 });

            expect(mockService.getMyRoundSubmission).toHaveBeenCalledWith(3, req.user);
        });
    });

    describe('createForRound', () => {
        it('should create submission', async () => {
            const dto = {
                github_repo_url: 'https://github.com/test',
            };

            const req = { user: { userId: 1 } } as any;

            mockService.createForRound.mockResolvedValue({ id: 1 });

            const result = await controller.createForRound(7, dto as any, req);

            expect(result).toEqual({ id: 1 });

            expect(mockService.createForRound).toHaveBeenCalledWith(7, dto, req.user);
        });
    });

    describe('updateSubmission', () => {
        it('should update submission', async () => {
            const dto = { description: 'updated' };

            const req = { user: { userId: 1 } } as any;

            mockService.updateSubmission.mockResolvedValue({ id: 5 });

            const result = await controller.updateSubmission(5, dto as any, req);

            expect(result).toEqual({ id: 5 });

            expect(mockService.updateSubmission).toHaveBeenCalledWith(5, dto, req.user);
        });
    });
});