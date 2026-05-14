import { Test } from '@nestjs/testing';
import { ChatGateway } from './chat.gateway';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ChatMessagesService } from './chat-messages.service';
import { UsersService } from '../users/users.service';
import { ChatReactionsService } from '../chat-reactions/chat-reactions.service';
import { ChatPinnedService } from '../chat-pinned/chat-pinned.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ChatRoomMember } from '../teams/entities/chat-room-member.entity';

describe('ChatGateway', () => {
    let gateway: ChatGateway;

    const mockServer = {
        emit: jest.fn(),
        to: jest.fn().mockReturnThis(),
        sockets: {
            sockets: new Map(),
        },
    };

    const chatMessagesService = {
        findByRoom: jest.fn(),
        createMessage: jest.fn(),
    };

    const chatReactionsService = {
        toggle: jest.fn(),
    };

    const chatPinnedService = {
        pin: jest.fn(),
        unpin: jest.fn(),
        findByRoom: jest.fn(),
    };

    const usersService = {
        updatePresence: jest.fn(),
    };

    const jwtService = {
        verify: jest.fn(),
    };

    const configService = {
        get: jest.fn().mockReturnValue('secret'),
    };

    const chatRoomMemberRepo = {
        findOne: jest.fn(),
    };

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [
                ChatGateway,

                { provide: ChatMessagesService, useValue: chatMessagesService },
                { provide: ChatReactionsService, useValue: chatReactionsService },
                { provide: ChatPinnedService, useValue: chatPinnedService },
                { provide: UsersService, useValue: usersService },
                { provide: JwtService, useValue: jwtService },
                { provide: ConfigService, useValue: configService },

                {
                    provide: getRepositoryToken(ChatRoomMember),
                    useValue: chatRoomMemberRepo,
                },
            ],
        }).compile();

        gateway = module.get(ChatGateway);
        gateway.server = mockServer as any;
    });

    afterEach(() => jest.clearAllMocks());

    it('should be defined', () => {
        expect(gateway).toBeDefined();
    });

    it('should authenticate connection', async () => {
        jwtService.verify.mockReturnValue({
            userId: 1,
            username: 'test',
            role: 'user',
            first_name: 'John',
            last_name: 'Doe',
        });

        usersService.updatePresence.mockResolvedValue({
            id: 1,
            status: 'online',
            last_seen_at: new Date(),
        });

        const client: any = {
            handshake: { auth: { token: 'token' } },
            emit: jest.fn(),
            disconnect: jest.fn(),
            join: jest.fn(),
            id: 'socket-1',
        };

        await gateway.handleConnection(client);

        expect(jwtService.verify).toHaveBeenCalled();
        expect(usersService.updatePresence).toHaveBeenCalled();
        expect(client.emit).toHaveBeenCalledWith(
            'connected',
            expect.any(Object),
        );
    });
});