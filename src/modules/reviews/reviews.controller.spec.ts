import { Test, TestingModule } from '@nestjs/testing';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

describe('ReviewsController', () => {
    let controller: ReviewsController;

    const mockReviewsService = {
        findAll: jest.fn(),
        create: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [ReviewsController],
            providers: [
                {
                    provide: ReviewsService,
                    useValue: mockReviewsService,
                },
            ],
        }).compile();

        controller = module.get<ReviewsController>(ReviewsController);

        jest.clearAllMocks();
    });

    describe('findAll', () => {
        it('should return reviews without query', async () => {
            const result = [
                {
                    id: 1,
                    author: 'Igor',
                },
            ];

            mockReviewsService.findAll.mockResolvedValue(result);

            expect(await controller.findAll()).toEqual(result);

            expect(mockReviewsService.findAll).toHaveBeenCalledWith(
                undefined,
            );
        });

        it('should return filtered reviews', async () => {
            const result = [
                {
                    id: 2,
                    author: 'Alex',
                },
            ];

            mockReviewsService.findAll.mockResolvedValue(result);

            expect(await controller.findAll('alex')).toEqual(result);

            expect(mockReviewsService.findAll).toHaveBeenCalledWith(
                'alex',
            );
        });
    });

    describe('create', () => {
        it('should create review', async () => {
            const dto = {
                name: 'Igor',
                email: 'igor@test.com',
                rating: 5,
                text: 'Great platform',
            };

            const req = {
                user: {
                    userId: 10,
                },
            } as any;

            const result = {
                id: 1,
                author: 'Igor',
                text: 'Great platform',
                rating: 5,
            };

            mockReviewsService.create.mockResolvedValue(result);

            expect(await controller.create(dto as any, req)).toEqual(result);

            expect(mockReviewsService.create).toHaveBeenCalledWith(
                dto,
                10,
            );
        });

        it('should create anonymous review when user does not exist', async () => {
            const dto = {
                name: 'Anon',
                rating: 4,
                text: 'Good',
            };

            const req = {} as any;

            mockReviewsService.create.mockResolvedValue({
                id: 2,
            });

            await controller.create(dto as any, req);

            expect(mockReviewsService.create).toHaveBeenCalledWith(
                dto,
                undefined,
            );
        });
    });
});