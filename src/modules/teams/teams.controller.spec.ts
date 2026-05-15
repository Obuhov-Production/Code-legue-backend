import { Test, TestingModule } from '@nestjs/testing';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

const mockTeamsService = {
    findMyTeams: jest.fn(),
    createTeam: jest.fn(),
    getTeamsByTournament: jest.fn(),
    getMyPendingInvites: jest.fn(),
    getInviteDetails: jest.fn(),
    acceptInvite: jest.fn(),
    rejectInvite: jest.fn(),
    getTeamById: jest.fn(),
    updateTeam: jest.fn(),
    deleteTeam: jest.fn(),
    upsertRepository: jest.fn(),
    getRepository: jest.fn(),
    verifyRepository: jest.fn(),
    getRepositoryFiles: jest.fn(),
    getRepositoryFile: jest.fn(),
    createCodeComment: jest.fn(),
    getChatMembers: jest.fn(),
    addChatMember: jest.fn(),
    removeChatMember: jest.fn(),
    linkMemberToUser: jest.fn(),
};

const mockJwtGuard = {
    canActivate: jest.fn((ctx) => {
        const req = ctx.switchToHttp().getRequest();
        req.user = { userId: 1, role: 'user', email: 'test@test.com' };
        return true;
    }),
};

describe('TeamsController', () => {
    let controller: TeamsController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [TeamsController],
            providers: [{ provide: TeamsService, useValue: mockTeamsService }],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue(mockJwtGuard)
            .compile();

        controller = module.get<TeamsController>(TeamsController);
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('getMyTeams should call service with userId', async () => {
        mockTeamsService.findMyTeams.mockResolvedValue(['team']);

        const req: any = { user: { userId: 10 } };

        const result = await controller.getMyTeams(req);

        expect(mockTeamsService.findMyTeams).toHaveBeenCalledWith(10);
        expect(result).toEqual(['team']);
    });

    it('createTeam should call service', async () => {
        mockTeamsService.createTeam.mockResolvedValue({ id: 1 });

        const req: any = { user: { userId: 1 } };
        const dto: any = { name: 'A', tournament_id: 1 };

        const result = await controller.createTeam(dto, req);

        expect(mockTeamsService.createTeam).toHaveBeenCalledWith(dto, req.user);
        expect(result).toEqual({ id: 1 });
    });

    it('getTeamsByTournament should call service', async () => {
        mockTeamsService.getTeamsByTournament.mockResolvedValue([]);

        const result = await controller.getTeamsByTournament(5);

        expect(mockTeamsService.getTeamsByTournament).toHaveBeenCalledWith(5);
        expect(result).toEqual([]);
    });

    it('acceptInvite should pass params correctly', async () => {
        mockTeamsService.acceptInvite.mockResolvedValue({ success: true });

        const req: any = { user: { userId: 2 } };

        const result = await controller.acceptInvite(10, req);

        expect(mockTeamsService.acceptInvite).toHaveBeenCalledWith(10, 2);
        expect(result).toEqual({ success: true });
    });

    it('deleteTeam should call service with user', async () => {
        mockTeamsService.deleteTeam.mockResolvedValue({ success: true });

        const req: any = { user: { userId: 1 } };

        const result = await controller.deleteTeam(3, req);

        expect(mockTeamsService.deleteTeam).toHaveBeenCalledWith(3, req.user);
        expect(result).toEqual({ success: true });
    });
});