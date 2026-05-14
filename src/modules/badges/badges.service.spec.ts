import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadgesService } from './badges.service';
import { Badge } from './entities/badge.entity';
import { NotFoundException } from '@nestjs/common';

const mockRepo = () => ({
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
});

describe('BadgesService', () => {
    let service: BadgesService;
    let repo: any;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [
                BadgesService,
                {
                    provide: getRepositoryToken(Badge),
                    useValue: mockRepo(),
                },
            ],
        }).compile();

        service = module.get(BadgesService);
        repo = module.get(getRepositoryToken(Badge));

        jest.clearAllMocks();
    });

    it('should return badges by user', async () => {
        repo.find.mockResolvedValue([
            {
                id: 1,
                userId: 1,
                name: 'Pro',
                granted_at: new Date(),
            },
        ]);

        const result = await service.getBadgesByUser(1);

        expect(repo.find).toHaveBeenCalledWith({
            where: { userId: 1 },
            order: { granted_at: 'DESC' },
        });

        expect(result).toHaveLength(1);
    });

    it('should grant badge', async () => {
        repo.create.mockReturnValue({
            userId: 1,
            name: 'Pro',
        });

        repo.save.mockResolvedValue({
            id: 1,
            userId: 1,
            name: 'Pro',
        });

        const result = await service.grantBadge(1, {
            name: 'Pro',
            icon_url: 'url',
            description: 'desc',
        });

        expect(repo.create).toHaveBeenCalledWith({
            userId: 1,
            name: 'Pro',
            icon_url: 'url',
            description: 'desc',
        });

        expect(repo.save).toHaveBeenCalled();
        expect(result.id).toBe(1);
    });

    it('should delete badge successfully', async () => {
        repo.findOne.mockResolvedValue({
            id: 1,
            userId: 1,
            name: 'Pro',
        });

        repo.delete.mockResolvedValue({ affected: 1 });

        const result = await service.deleteBadge(1, 1);

        expect(repo.findOne).toHaveBeenCalledWith({
            where: { id: 1, userId: 1 },
        });

        expect(repo.delete).toHaveBeenCalledWith(1);

        expect(result).toEqual(undefined);
    });

    it('should throw if badge not found', async () => {
        repo.findOne.mockResolvedValue(null);

        await expect(service.deleteBadge(1, 1)).rejects.toThrow(
            NotFoundException,
        );
    });
});