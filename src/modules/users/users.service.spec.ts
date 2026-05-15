import { Test } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Badge } from '../badges/entities/badge.entity';
import { MailService } from '../mail/mail.service';

describe('UsersService', () => {
    let service: UsersService;

    const repoMock = () => ({
        findOne: jest.fn(),
        find: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
        createQueryBuilder: jest.fn(() => ({
            select: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            getMany: jest.fn(),
            getOne: jest.fn(),
        })),
    });

    const mailMock = {
        send: jest.fn(),
    };

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [
                UsersService,
                { provide: getRepositoryToken(User), useValue: repoMock() },
                { provide: getRepositoryToken(Badge), useValue: repoMock() },
                { provide: MailService, useValue: mailMock },
            ],
        }).compile();

        service = module.get(UsersService);
    });

    afterEach(() => jest.clearAllMocks());

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('maskEmail should work', () => {
        const result = (service as any).maskEmail('test@gmail.com');
        expect(result).toContain('@gmail.com');
    });

    it('formatLastSeenText should handle null', () => {
        const result = (service as any).formatLastSeenText(null);
        expect(result).toBe('never');
    });

    it('requestPasswordChange should throw if user not found', async () => {
        const repo = (service as any).userRepository;
        repo.findOne.mockResolvedValue(null);

        await expect(service.requestPasswordChange(1)).rejects.toThrow();
    });
});