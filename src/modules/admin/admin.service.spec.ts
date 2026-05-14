import { Test } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { getRepositoryToken } from '@nestjs/typeorm';

import { User } from '../users/entities/user.entity';
import { Tournament } from '../tournaments/entities/tournament.entity';
import { Team } from '../teams/entities/team.entity';
import { Submission } from '../submissions/entities/submission.entity';
import { ChatRoomSettings } from '../chat-room-settings/entities/chat-room-setting.entity';
import { Message } from '../chat-messages/entities/chat-message.entity';
import { ChatRoom } from '../chat-room/entities/chat-room.entity';

const mockRepo = () => ({
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    query: jest.fn(),
    createQueryBuilder: jest.fn(),
});

describe('AdminService', () => {
    let service: AdminService;
    let userRepo: ReturnType<typeof mockRepo>;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [
                AdminService,

                { provide: getRepositoryToken(User), useValue: mockRepo() },
                { provide: getRepositoryToken(Tournament), useValue: mockRepo() },
                { provide: getRepositoryToken(Team), useValue: mockRepo() },
                { provide: getRepositoryToken(Submission), useValue: mockRepo() },
                { provide: getRepositoryToken(ChatRoomSettings), useValue: mockRepo() },
                { provide: getRepositoryToken(Message), useValue: mockRepo() },
                { provide: getRepositoryToken(ChatRoom), useValue: mockRepo() },
            ],
        }).compile();

        service = module.get(AdminService);
        userRepo = module.get(getRepositoryToken(User));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});