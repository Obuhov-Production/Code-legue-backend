import { Test, TestingModule } from '@nestjs/testing';
import { TeamsService } from './teams.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Team } from './entities/team.entity';
import { TeamMember } from '../team-members/entities/team-member.entity';
import { Tournament } from '../tournaments/entities/tournament.entity';
import { User } from '../users/entities/user.entity';
import { TournamentRepository } from './entities/tournament-repository.entity';
import { CodeReview } from './entities/code-review.entity';
import { ChatRoomMember } from './entities/chat-room-member.entity';
import { Badge } from '../badges/entities/badge.entity';
import { ChatRoom } from '../chat-room/entities/chat-room.entity';
import { NotificationsService } from '../notifications/notifications.service';

const repoMock = () => ({
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn((x) => x),
    delete: jest.fn(),
    count: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        whereInIds: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
        getOne: jest.fn(),
    })),
});

const notificationsMock = {
    create: jest.fn(),
};

describe('TeamsService', () => {
    let service: TeamsService;

    let teamRepo: ReturnType<typeof repoMock>;
    let memberRepo: ReturnType<typeof repoMock>;
    let tournamentRepo: ReturnType<typeof repoMock>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TeamsService,
                { provide: getRepositoryToken(Team), useValue: repoMock() },
                { provide: getRepositoryToken(TeamMember), useValue: repoMock() },
                { provide: getRepositoryToken(Tournament), useValue: repoMock() },
                { provide: getRepositoryToken(User), useValue: repoMock() },
                { provide: getRepositoryToken(TournamentRepository), useValue: repoMock() },
                { provide: getRepositoryToken(CodeReview), useValue: repoMock() },
                { provide: getRepositoryToken(ChatRoomMember), useValue: repoMock() },
                { provide: getRepositoryToken(Badge), useValue: repoMock() },
                { provide: getRepositoryToken(ChatRoom), useValue: repoMock() },
                { provide: NotificationsService, useValue: notificationsMock },
            ],
        }).compile();

        service = module.get<TeamsService>(TeamsService);

        teamRepo = module.get(getRepositoryToken(Team));
        memberRepo = module.get(getRepositoryToken(TeamMember));
        tournamentRepo = module.get(getRepositoryToken(Tournament));

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('findMyTeams should return array', async () => {
        teamRepo.find.mockResolvedValue([
            { id: 1, name: 'T1', captain_id: 1, tournament: {} },
        ]);

        memberRepo.find.mockResolvedValue([]);

        const result = await service.findMyTeams(1);

        expect(Array.isArray(result)).toBe(true);
    });

    it('createTeam should throw if tournament not found', async () => {
        tournamentRepo.findOne.mockResolvedValue(null);

        await expect(
            service.createTeam({ name: 'A', tournament_id: 1 } as any, {
                userId: 1,
            }),
        ).rejects.toThrow();
    });
});