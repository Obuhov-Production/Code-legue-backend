import { Test } from '@nestjs/testing';
import { ChatReactionsService } from './chat-reactions.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ChatReaction } from './entities/chat-reaction.entity';

describe('ChatReactionsService', () => {
    let service: ChatReactionsService;

    const repoMock = {
        createQueryBuilder: jest.fn(),
        findOne: jest.fn(),
        find: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
        remove: jest.fn(),
    };

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [
                ChatReactionsService,
                {
                    provide: getRepositoryToken(ChatReaction),
                    useValue: repoMock,
                },
            ],
        }).compile();

        service = module.get(ChatReactionsService);
    });

    afterEach(() => jest.clearAllMocks());

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('findByRoom should group reactions correctly', async () => {
        repoMock.createQueryBuilder.mockReturnValue({
            innerJoin: () => ({
                select: () => ({
                    getMany: async () => [
                        { message_id: 1, emoji: '👍', user_id: 10 },
                        { message_id: 1, emoji: '👍', user_id: 11 },
                        { message_id: 2, emoji: '🔥', user_id: 12 },
                    ],
                }),
            }),
        });

        const result = await service.findByRoom('general');

        expect(result).toEqual({
            '1_👍': {
                emoji: '👍',
                count: 2,
                users: [10, 11],
            },
            '2_🔥': {
                emoji: '🔥',
                count: 1,
                users: [12],
            },
        });
    });

    it('toggle should add new reaction if not exists', async () => {
        repoMock.findOne.mockResolvedValue(null);
        repoMock.create.mockReturnValue({});

        repoMock.save.mockResolvedValue({});

        repoMock.find.mockResolvedValue([
            { user_id: 1 },
            { user_id: 2 },
        ]);

        const result = await service.toggle(1, 1, 'user', '👍');

        expect(repoMock.save).toHaveBeenCalled();
        expect(result.count).toBe(2);
    });

    it('toggle should remove reaction if exists', async () => {
        repoMock.findOne.mockResolvedValue({ id: 1 });
        repoMock.remove.mockResolvedValue({});

        repoMock.find.mockResolvedValue([{ user_id: 2 }]);

        const result = await service.toggle(1, 1, 'user', '👍');

        expect(repoMock.remove).toHaveBeenCalled();
        expect(result.users).toEqual([2]);
    });
});