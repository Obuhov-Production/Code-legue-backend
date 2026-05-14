import { Test } from '@nestjs/testing';
import { AnnouncementsService } from './announcements.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Announcement } from './entities/announcement.entity';
import { NotFoundException } from '@nestjs/common';

const mockRepo = () => ({
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
});

describe('AnnouncementsService', () => {
    let service: AnnouncementsService;
    let repo: ReturnType<typeof mockRepo>;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [
                AnnouncementsService,
                {
                    provide: getRepositoryToken(Announcement),
                    useValue: mockRepo(),
                },
            ],
        }).compile();

        service = module.get(AnnouncementsService);
        repo = module.get(getRepositoryToken(Announcement));
    });

    afterEach(() => jest.clearAllMocks());

    it('should create announcement', async () => {
        const fakeAnnouncement = {
            id: 1,
            title: 'test',
            message: 'hello',
        };

        repo.create.mockReturnValue(fakeAnnouncement);
        repo.save.mockResolvedValue(fakeAnnouncement);

        const result = await service.create(1, 'test', 'hello');

        expect(repo.create).toHaveBeenCalledWith({
            tournament_id: 1,
            title: 'test',
            message: 'hello',
        });

        expect(repo.save).toHaveBeenCalled();
        expect(result).toEqual(fakeAnnouncement);
    });

    it('should remove announcement', async () => {
        repo.findOne.mockResolvedValue({
            id: 1,
            title: 'test',
        });

        repo.remove.mockResolvedValue({});

        const result = await service.remove(1);

        expect(repo.findOne).toHaveBeenCalledWith({
            where: { id: 1 },
        });

        expect(repo.remove).toHaveBeenCalled();

        expect(result).toEqual({
            message: 'Announcement deleted successfully',
        });
    });

    it('should throw if announcement not found', async () => {
        repo.findOne.mockResolvedValue(null);

        await expect(service.remove(999))
            .rejects
            .toThrow(NotFoundException);
    });
});