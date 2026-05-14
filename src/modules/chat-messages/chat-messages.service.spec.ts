import { Test } from '@nestjs/testing';
import { ChatMessagesService } from './chat-messages.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Message } from './entities/chat-message.entity';
import { ChatRoom } from '../chat-room/entities/chat-room.entity';

describe('ChatMessagesService', () => {
    let service: ChatMessagesService;

    const messageRepoMock = {
        createQueryBuilder: jest.fn(),
        findOne: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        find: jest.fn(),
    };

    const chatRoomRepoMock = {
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        find: jest.fn(),
    };

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [
                ChatMessagesService,
                {
                    provide: getRepositoryToken(Message),
                    useValue: messageRepoMock,
                },
                {
                    provide: getRepositoryToken(ChatRoom),
                    useValue: chatRoomRepoMock,
                },
            ],
        }).compile();

        service = module.get(ChatMessagesService);
    });

    afterEach(() => jest.clearAllMocks());

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('ensureRoom creates room if not exists', async () => {
        chatRoomRepoMock.findOne.mockResolvedValue(null);
        chatRoomRepoMock.create.mockReturnValue({ name: 'test' });
        chatRoomRepoMock.save.mockResolvedValue({});

        await service.ensureRoom('test', 1);

        expect(chatRoomRepoMock.save).toHaveBeenCalled();
    });

    it('markRoomAsRead returns ids', async () => {
        messageRepoMock.find.mockResolvedValue([
            { id: 1, user_id: 2, is_read: false },
            { id: 2, user_id: 3, is_read: false },
        ]);

        messageRepoMock.createQueryBuilder.mockReturnValue({
            update: () => ({
                set: () => ({
                    whereInIds: () => ({
                        execute: jest.fn(),
                    }),
                }),
            }),
        });

        const result = await service.markRoomAsRead('room', 1);

        expect(result.length).toBe(2);
    });
});