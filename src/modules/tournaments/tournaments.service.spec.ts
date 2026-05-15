import { Test, TestingModule } from '@nestjs/testing';
import { TournamentsService } from './tournaments.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Tournament } from './entities/tournament.entity';
import { Team } from '../teams/entities/team.entity';
import { User } from '../users/entities/user.entity';
import { ChatRoom } from '../chat-room/entities/chat-room.entity';
import { ChatRoomMember } from '../teams/entities/chat-room-member.entity';
import { Round } from '../rounds/entities/round.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { ChatGateway } from '../chat-messages/chat.gateway';

const repoMock = () => ({
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn((x) => x),
    update: jest.fn(),
    delete: jest.fn(),
    findBy: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(0),
    })),
});

const notificationsMock = {
    notifyAdmins: jest.fn().mockResolvedValue([]),
};

const gatewayMock = {
    sendToUser: jest.fn(),
};

describe('TournamentsService', () => {
    let service: TournamentsService;
    let tournamentRepo: ReturnType<typeof repoMock>;

    beforeEach(async () => {
        // 🔥 FIX: allow all status transitions for tests
        process.env.ALLOW_WRITE_TOURNAMENT_STATUS = 'true';

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TournamentsService,
                { provide: getRepositoryToken(Tournament), useValue: repoMock() },
                { provide: getRepositoryToken(Team), useValue: repoMock() },
                { provide: getRepositoryToken(User), useValue: repoMock() },
                { provide: getRepositoryToken(ChatRoom), useValue: repoMock() },
                { provide: getRepositoryToken(ChatRoomMember), useValue: repoMock() },
                { provide: getRepositoryToken(Round), useValue: repoMock() },
                { provide: NotificationsService, useValue: notificationsMock },
                { provide: ChatGateway, useValue: gatewayMock },
            ],
        }).compile();

        service = module.get<TournamentsService>(TournamentsService);
        tournamentRepo = module.get(getRepositoryToken(Tournament));

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('create should save tournament', async () => {
        tournamentRepo.create.mockReturnValue({ name: 'T1' });
        tournamentRepo.save.mockResolvedValue({ id: 1, name: 'T1' });

        const result = await service.create(
            {
                name: 'T1',
                start_date: '2026-01-01',
                end_date: '2026-01-02',
                registration_start: '2026-01-01',
                registration_end: '2026-01-01',
            } as any,
            1,
        );

        expect(tournamentRepo.save).toHaveBeenCalled();
        expect(result).toHaveProperty('id');
    });

    it('getById should throw if not found', async () => {
        tournamentRepo.findOne.mockResolvedValue(null);

        await expect(service.getById(1)).rejects.toThrow();
    });

    it('updateStatus should update tournament', async () => {
        tournamentRepo.findOne.mockResolvedValue({
            id: 1,
            status: 'DRAFT',
        });

        tournamentRepo.update.mockResolvedValue({ affected: 1 });

        const result = await service.updateStatus(
            1,
            'RUNNING' as any,
            { userId: 1, role: 'admin' },
        );

        expect(tournamentRepo.update).toHaveBeenCalledWith(
            { id: 1 },
            { status: 'RUNNING' },
        );

        expect(result).toEqual({
            success: true,
            status: 'RUNNING',
        });
    });
});