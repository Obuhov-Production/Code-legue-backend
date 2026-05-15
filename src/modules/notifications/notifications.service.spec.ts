import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { NotificationsService } from './notifications.service';

import { Notification } from './entities/notification.entity';
import { User } from '../users/entities/user.entity';

describe('NotificationsService', () => {
    let service: NotificationsService;

    const mockNotificationRepo = {
        create: jest.fn(),
        save: jest.fn(),
        find: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
    };

    const mockUserRepo = {
        createQueryBuilder: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                NotificationsService,
                {
                    provide: getRepositoryToken(Notification),
                    useValue: mockNotificationRepo,
                },
                {
                    provide: getRepositoryToken(User),
                    useValue: mockUserRepo,
                },
            ],
        }).compile();

        service = module.get<NotificationsService>(NotificationsService);

        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should create notification', async () => {
            const notification = {
                userId: 1,
                message: 'Hello',
                is_read: false,
            };

            mockNotificationRepo.create.mockReturnValue(notification);
            mockNotificationRepo.save.mockResolvedValue(notification);

            const result = await service.create({
                userId: 1,
                message: 'Hello',
            });

            expect(result).toEqual(notification);

            expect(mockNotificationRepo.create).toHaveBeenCalled();
            expect(mockNotificationRepo.save).toHaveBeenCalledWith(
                notification,
            );
        });
    });

    describe('findForUser', () => {
        it('should return notifications for user', async () => {
            const notifications = [{ id: 1 }];

            mockNotificationRepo.find.mockResolvedValue(notifications);

            expect(await service.findForUser(5)).toEqual(notifications);

            expect(mockNotificationRepo.find).toHaveBeenCalledWith({
                where: { userId: 5 },
                order: { created_at: 'DESC' },
                take: 50,
            });
        });
    });

    describe('markRead', () => {
        it('should mark notification as read', async () => {
            mockNotificationRepo.update.mockResolvedValue(undefined);

            const result = await service.markRead(1, 2);

            expect(result).toEqual({ success: true });

            expect(mockNotificationRepo.update).toHaveBeenCalledWith(
                { id: 1, userId: 2 },
                { is_read: true },
            );
        });
    });

    describe('markAllRead', () => {
        it('should mark all notifications as read', async () => {
            mockNotificationRepo.update.mockResolvedValue(undefined);

            await service.markAllRead(3);

            expect(mockNotificationRepo.update).toHaveBeenCalledWith(
                { userId: 3, is_read: false },
                { is_read: true },
            );
        });
    });

    describe('remove', () => {
        it('should remove notification', async () => {
            mockNotificationRepo.delete.mockResolvedValue(undefined);

            await service.remove(5, 1);

            expect(mockNotificationRepo.delete).toHaveBeenCalledWith({
                id: 5,
                userId: 1,
            });
        });
    });

    describe('removeAll', () => {
        it('should remove all notifications', async () => {
            mockNotificationRepo.delete.mockResolvedValue(undefined);

            await service.removeAll(8);

            expect(mockNotificationRepo.delete).toHaveBeenCalledWith({
                userId: 8,
            });
        });
    });

    describe('notifyAdmins', () => {
        it('should notify all admins', async () => {
            const admins = [
                { id: 1 },
                { id: 2 },
            ];

            const qb = {
                where: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue(admins),
            };

            mockUserRepo.createQueryBuilder.mockReturnValue(qb);

            const createSpy = jest
                .spyOn(service, 'create')
                .mockImplementation(async (data: any) => data as any);

            const result = await service.notifyAdmins(
                'Important message',
            );

            expect(result.length).toBe(2);

            expect(createSpy).toHaveBeenCalledTimes(2);

            expect(qb.where).toHaveBeenCalledWith(
                'u.role LIKE :role',
                { role: '%admin%' },
            );
        });
    });
});