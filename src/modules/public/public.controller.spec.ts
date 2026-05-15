import { Test, TestingModule } from '@nestjs/testing';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';

describe('PublicController', () => {
    let controller: PublicController;

    const mockPublicService = {
        getTournaments: jest.fn(),
        getLeaderboard: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [PublicController],
            providers: [
                {
                    provide: PublicService,
                    useValue: mockPublicService,
                },
            ],
        }).compile();

        controller = module.get<PublicController>(PublicController);

        jest.clearAllMocks();
    });

    describe('getTournaments', () => {
        it('should return tournaments', async () => {
            const result = [
                {
                    id: 1,
                    name: 'Tournament',
                },
            ];

            mockPublicService.getTournaments.mockResolvedValue(result);

            expect(await controller.getTournaments()).toEqual(result);

            expect(mockPublicService.getTournaments).toHaveBeenCalled();
        });
    });

    describe('getLeaderboard', () => {
        it('should return leaderboard', async () => {
            const result = [
                {
                    rank: 1,
                    team_name: 'Team Alpha',
                },
            ];

            mockPublicService.getLeaderboard.mockResolvedValue(result);

            expect(await controller.getLeaderboard(5)).toEqual(result);

            expect(mockPublicService.getLeaderboard).toHaveBeenCalledWith(5);
        });
    });
});