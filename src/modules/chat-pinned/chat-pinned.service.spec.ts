import { Test } from '@nestjs/testing';
import { ChatPinnedService } from './chat-pinned.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ChatPinned } from './entities/chat-pinned.entity';

describe('ChatPinnedService', () => {
    let service: ChatPinnedService;

    const repoMock = {
        find: jest.fn(),
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        delete: jest.fn(),
    };

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [
                ChatPinnedService,
                {
                    provide: getRepositoryToken(ChatPinned),
                    useValue: repoMock,
                },
            ],
        }).compile();

        service = module.get(ChatPinnedService);
    });

    afterEach(() => jest.clearAllMocks());

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('findByRoom should return pinned messages', async () => {
        repoMock.find.mockResolvedValue([{ id: 1, room: 'general' }]);

        const result = await service.findByRoom('general');

        expect(repoMock.find).toHaveBeenCalledWith({
            where: { room: 'general' },
            relations: ['message', 'user'],
            order: { pinned_at: 'DESC' },
        });

        expect(result).toEqual([{ id: 1, room: 'general' }]);
    });

    it('pin should create new entry if not exists', async () => {
        repoMock.findOne.mockResolvedValue(null);
        repoMock.create.mockReturnValue({ room: 'general' });
        repoMock.save.mockResolvedValue({ id: 1 });

        const result = await service.pin('general', 10, 1);

        expect(repoMock.findOne).toHaveBeenCalledWith({
            where: { room: 'general', message_id: 10 },
        });

        expect(repoMock.save).toHaveBeenCalled();
        expect(result).toEqual({ id: 1 });
    });

    it('pin should return existing entry', async () => {
        repoMock.findOne.mockResolvedValue({ id: 99 });

        const result = await service.pin('general', 10, 1);

        expect(repoMock.save).not.toHaveBeenCalled();
        expect(result).toEqual({ id: 99 });
    });

    it('unpin should call delete', async () => {
        await service.unpin('general', 10);

        expect(repoMock.delete).toHaveBeenCalledWith({
            room: 'general',
            message_id: 10,
        });
    });
});