import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ApplicationsService } from './applications.service';
import { OrganizerApplication, ApplicationStatus } from './entities/organizer-application.entity';
import { User } from '../users/entities/user.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

// ---------------- MOCK REPOS ----------------
const mockRepo = () => ({
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
});

// ---------------- MOCK SERVICES ----------------
const notificationsServiceMock = {
    notifyAdmins: jest.fn(),
    create: jest.fn(),
};

const chatGatewayMock = {
    sendToUser: jest.fn(),
};

describe('ApplicationsService', () => {
    let service: ApplicationsService;
    let appRepo: any;
    let userRepo: any;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [
                ApplicationsService,

                {
                    provide: getRepositoryToken(OrganizerApplication),
                    useValue: mockRepo(),
                },
                {
                    provide: getRepositoryToken(User),
                    useValue: mockRepo(),
                },

                {
                    provide: require('../notifications/notifications.service').NotificationsService,
                    useValue: notificationsServiceMock,
                },
                {
                    provide: require('../chat-messages/chat.gateway').ChatGateway,
                    useValue: chatGatewayMock,
                },
            ],
        }).compile();

        service = module.get(ApplicationsService);

        appRepo = module.get(getRepositoryToken(OrganizerApplication));
        userRepo = module.get(getRepositoryToken(User));
    });

    afterEach(() => jest.clearAllMocks());

    // ---------------- TESTS ----------------

    it('should submit application', async () => {
        appRepo.findOne.mockResolvedValue(null);

        appRepo.create.mockReturnValue({
            userId: 1,
            motivation: 'test',
        });

        appRepo.save.mockResolvedValue({
            id: 1,
            userId: 1,
        });

        userRepo.findOne.mockResolvedValue({
            username: 'John',
        });

        notificationsServiceMock.notifyAdmins.mockResolvedValue([
            { userId: 2 },
        ]);

        const result = await service.submitOrganizer(
            1,
            'motivation',
            'experience',
            'a@a.com',
            '@tg',
            '123',
        );

        expect(appRepo.create).toHaveBeenCalled();
        expect(appRepo.save).toHaveBeenCalled();
        expect(result).toEqual({ id: 1, userId: 1 });
    });

    it('should throw if application not found in review', async () => {
        appRepo.findOne.mockResolvedValue(null);

        await expect(
            service.reviewOrganizer(1, ApplicationStatus.APPROVED),
        ).rejects.toThrow(NotFoundException);
    });

    it('should reject already processed application', async () => {
        appRepo.findOne.mockResolvedValue({
            id: 1,
            status: ApplicationStatus.APPROVED,
        });

        await expect(
            service.reviewOrganizer(1, ApplicationStatus.REJECTED),
        ).rejects.toThrow(BadRequestException);
    });
});
