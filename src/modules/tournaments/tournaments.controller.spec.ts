import { Test, TestingModule } from '@nestjs/testing';
import { TournamentsController } from './tournaments.controller';
import { TournamentsService } from './tournaments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

const serviceMock = {
    getAll: jest.fn(),
    getById: jest.fn(),
    getLeaderboard: jest.fn(),
    getAssignedJury: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    updateStatus: jest.fn(),
    getActiveRound: jest.fn(),
    advanceRound: jest.fn(),
    uploadFile: jest.fn(),
    listFiles: jest.fn(),
};

const jwtGuardMock = {
    canActivate: (ctx: any) => {
        const req = ctx.switchToHttp().getRequest();
        req.user = { userId: 1, role: 'admin' };
        return true;
    },
};

describe('TournamentsController', () => {
    let controller: TournamentsController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [TournamentsController],
            providers: [{ provide: TournamentsService, useValue: serviceMock }],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue(jwtGuardMock)
            .compile();

        controller = module.get(TournamentsController);
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('getAll should call service', async () => {
        serviceMock.getAll.mockResolvedValue(['t']);

        const result = await controller.getAll(undefined);

        expect(serviceMock.getAll).toHaveBeenCalledWith(undefined);
        expect(result).toEqual(['t']);
    });

    it('getById should pass id', async () => {
        serviceMock.getById.mockResolvedValue({ id: 1 });

        const result = await controller.getById('1');

        expect(serviceMock.getById).toHaveBeenCalledWith(1);
        expect(result).toEqual({ id: 1 });
    });

    it('create should call service with userId', async () => {
        serviceMock.create.mockResolvedValue({ id: 1 });

        const req: any = { user: { userId: 5 } };

        const result = await controller.create({ name: 't' } as any, req);

        expect(serviceMock.create).toHaveBeenCalledWith({ name: 't' }, 5);
        expect(result).toEqual({ id: 1 });
    });

    it('updateStatus should call service', async () => {
        serviceMock.updateStatus.mockResolvedValue({ success: true });

        const req: any = { user: { userId: 1 } };

        const result = await controller.updateStatus('1', 'RUNNING' as any, req);

        expect(serviceMock.updateStatus).toHaveBeenCalled();
        expect(result).toEqual({ success: true });
    });
});