import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException } from '@nestjs/common';

import { ReviewsService } from './reviews.service';

import { Review } from './entities/review.entity';

describe('ReviewsService', () => {
    let service: ReviewsService;

    const mockReviewRepo = {
        find: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ReviewsService,
                {
                    provide: getRepositoryToken(Review),
                    useValue: mockReviewRepo,
                },
            ],
        }).compile();

        service = module.get<ReviewsService>(ReviewsService);

        jest.clearAllMocks();
    });

    describe('findAll', () => {
        it('should return formatted reviews', async () => {
            const reviews = [
                {
                    id: 1,
                    name: 'Igor',
                    text: 'Excellent',
                    rating: 5,
                    created_at: new Date(),
                },
            ];

            mockReviewRepo.find.mockResolvedValue(reviews);

            const result = await service.findAll();

            expect(result[0]).toMatchObject({
                id: 1,
                author: 'Igor',
                text: 'Excellent',
                rating: 5,
            });

            expect(mockReviewRepo.find).toHaveBeenCalledWith({
                where: undefined,
                order: { created_at: 'DESC' },
            });
        });

        it('should search with query', async () => {
            mockReviewRepo.find.mockResolvedValue([]);

            await service.findAll('test');

            expect(mockReviewRepo.find).toHaveBeenCalled();

            const args = mockReviewRepo.find.mock.calls[0][0];

            expect(args.where).toBeDefined();
        });
    });

    describe('create', () => {
        it('should create review for authorized user', async () => {
            const dto = {
                name: 'Igor',
                email: 'igor@test.com',
                rating: 5,
                text: 'Amazing',
            };

            mockReviewRepo.findOne.mockResolvedValue(null);

            const createdReview = {
                ...dto,
                user_id: 1,
            };

            const savedReview = {
                id: 1,
                ...createdReview,
                created_at: new Date(),
            };

            mockReviewRepo.create.mockReturnValue(createdReview);

            mockReviewRepo.save.mockResolvedValue(savedReview);

            const result = await service.create(dto as any, 1);

            expect(result).toMatchObject({
                id: 1,
                author: 'Igor',
                text: 'Amazing',
                rating: 5,
            });

            expect(mockReviewRepo.findOne).toHaveBeenCalledWith({
                where: { user_id: 1 },
            });
        });

        it('should throw if user already left review', async () => {
            mockReviewRepo.findOne.mockResolvedValue({
                id: 1,
            });

            await expect(
                service.create(
                    {
                        name: 'Igor',
                        rating: 5,
                        text: 'Test',
                    } as any,
                    1,
                ),
            ).rejects.toThrow(ConflictException);
        });

        it('should create anonymous review', async () => {
            const dto = {
                name: 'Anon',
                rating: 4,
                text: 'Nice',
            };

            const createdReview = {
                ...dto,
                user_id: undefined,
            };

            const savedReview = {
                id: 2,
                ...createdReview,
                created_at: new Date(),
            };

            mockReviewRepo.create.mockReturnValue(createdReview);

            mockReviewRepo.save.mockResolvedValue(savedReview);

            const result = await service.create(dto as any);

            expect(result.author).toBe('Anon');

            expect(mockReviewRepo.findOne).not.toHaveBeenCalled();
        });
    });
});