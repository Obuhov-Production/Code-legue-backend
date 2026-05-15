import { Test } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

describe('UsersController', () => {
    let controller: UsersController;

    const mockService = {
        getUserById: jest.fn(),
        getUserByEmail: jest.fn(),
        updateMe: jest.fn(),
        getAllUsers: jest.fn(),
        getUsersByRole: jest.fn(),
        searchUsers: jest.fn(),
        getOnlineUsers: jest.fn(),
        getUserStatus: jest.fn(),
        getPublicProfile: jest.fn(),
        getPublicProfileByUsername: jest.fn(),
        deleteBanner: jest.fn(),
        deleteAccount: jest.fn(),
        requestPasswordChange: jest.fn(),
        verifyPasswordChangeCode: jest.fn(),
        confirmPasswordChange: jest.fn(),
        uploadAvatar: jest.fn(),
        uploadBanner: jest.fn(),
        updateMyStatus: jest.fn(),
    };

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            controllers: [UsersController],
            providers: [{ provide: UsersService, useValue: mockService }],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue({ canActivate: () => true })
            .compile();

        controller = module.get(UsersController);
    });

    afterEach(() => jest.clearAllMocks());

    it('should get me', async () => {
        mockService.getUserById.mockResolvedValue({ id: 1 });

        const result = await controller.getMe({ user: { userId: 1 } });

        expect(mockService.getUserById).toHaveBeenCalledWith(1);
        expect(result).toEqual({ id: 1 });
    });

    it('should update me', async () => {
        mockService.updateMe.mockResolvedValue({ ok: true });

        const result = await controller.updateMe({ user: { userId: 1 } }, { a: 1 });

        expect(mockService.updateMe).toHaveBeenCalledWith(1, { a: 1 });
        expect(result).toEqual({ ok: true });
    });

    it('should search users', async () => {
        mockService.searchUsers.mockResolvedValue([]);

        const result = await controller.searchUsers({ q: 'test' });

        expect(mockService.searchUsers).toHaveBeenCalledWith('test');
        expect(result).toEqual([]);
    });

    it('should get user status', async () => {
        mockService.getUserStatus.mockResolvedValue({ status: 'online' });

        const result = await controller.getUserStatus(1);

        expect(mockService.getUserStatus).toHaveBeenCalledWith(1);
        expect(result).toEqual({ status: 'online' });
    });

    it('should upload avatar validation fail', async () => {
        await expect(
            controller.uploadMyAvatar({ user: { userId: 1 } }, null as any),
        ).rejects.toThrow();
    });
});