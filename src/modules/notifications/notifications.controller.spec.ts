import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

describe('NotificationsController', () => {
    let controller: NotificationsController;

    const mockNotificationsService = {
        findForUser: jest.fn(),
        markRead: jest.fn(),
        markAllRead: jest.fn(),
        removeAll: jest.fn(),
        remove: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [NotificationsController],
            providers: [
                {
                    provide: NotificationsService,
                    useValue: mockNotificationsService,
                },
            ],
        }).compile();

        controller = module.get<NotificationsController>(
            NotificationsController,
        );

        jest.clearAllMocks();
    });

    describe('getMyNotifications', () => {
        it('should return notifications', async () => {
            const req = {
                user: {
                    userId: 1,
                },
            };

            const result = [{ id: 1, message: 'Test' }];

            mockNotificationsService.findForUser.mockResolvedValue(result);

            expect(await controller.getMyNotifications(req)).toEqual(result);

            expect(
                mockNotificationsService.findForUser,
            ).toHaveBeenCalledWith(1);
        });
    });

    describe('markRead', () => {
        it('should mark notification as read', async () => {
            const req = {
                user: {
                    userId: 2,
                },
            };

            const result = { success: true };

            mockNotificationsService.markRead.mockResolvedValue(result);

            expect(await controller.markRead(10, req)).toEqual(result);

            expect(mockNotificationsService.markRead).toHaveBeenCalledWith(
                10,
                2,
            );
        });
    });

    describe('markAllRead', () => {
        it('should mark all notifications as read', async () => {
            const req = {
                user: {
                    userId: 5,
                },
            };

            mockNotificationsService.markAllRead.mockResolvedValue(undefined);

            await controller.markAllRead(req);

            expect(
                mockNotificationsService.markAllRead,
            ).toHaveBeenCalledWith(5);
        });
    });

    describe('removeAll', () => {
        it('should remove all notifications', async () => {
            const req = {
                user: {
                    userId: 7,
                },
            };

            mockNotificationsService.removeAll.mockResolvedValue(undefined);

            await controller.removeAll(req);

            expect(mockNotificationsService.removeAll).toHaveBeenCalledWith(7);
        });
    });

    describe('remove', () => {
        it('should remove notification', async () => {
            const req = {
                user: {
                    userId: 9,
                },
            };

            mockNotificationsService.remove.mockResolvedValue(undefined);

            await controller.remove(12, req);

            expect(mockNotificationsService.remove).toHaveBeenCalledWith(
                12,
                9,
            );
        });
    });
});