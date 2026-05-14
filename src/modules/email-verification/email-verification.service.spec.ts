import { Test } from '@nestjs/testing';
import { EmailVerificationService } from './email-verification.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EmailVerification } from './entities/email-verification.entity';
import { User } from '../users/entities/user.entity';
import { MailService } from '../mail/mail.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('EmailVerificationService', () => {
    let service: EmailVerificationService;

    const repoMock = {
        findOne: jest.fn(),
        save: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
    };

    const userRepoMock = {
        findOne: jest.fn(),
        save: jest.fn(),
    };

    const mailMock = {
        sendVerificationCode: jest.fn().mockResolvedValue(undefined),
    };

    const jwtMock = {
        sign: jest.fn(),
        verify: jest.fn(),
    };

    const configMock = {
        get: jest.fn(),
    };

    const user = {
        id: 1,
        email: 'test@mail.com',
        is_email_verified: false,
    } as any;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [
                EmailVerificationService,
                { provide: getRepositoryToken(EmailVerification), useValue: repoMock },
                { provide: getRepositoryToken(User), useValue: userRepoMock },
                { provide: MailService, useValue: mailMock },
                { provide: JwtService, useValue: jwtMock },
                { provide: ConfigService, useValue: configMock },
            ],
        }).compile();

        service = module.get(EmailVerificationService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should issue pending token', () => {
        configMock.get.mockReturnValue('secret');
        jwtMock.sign.mockReturnValue('token');

        const result = service.issuePendingToken(user);

        expect(jwtMock.sign).toHaveBeenCalled();
        expect(result).toBe('token');
    });

    it('should issue and send code (new record)', async () => {
        repoMock.findOne.mockResolvedValue(null);

        repoMock.create.mockReturnValue({
            user_id: 1,
            sent_count: 0,
        });

        repoMock.save.mockResolvedValue({});

        (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

        configMock.get.mockReturnValue('secret');
        jwtMock.sign.mockReturnValue('pending-token');

        const result = await service.issueAndSendCode(user);

        expect(repoMock.save).toHaveBeenCalled();
        expect(mailMock.sendVerificationCode).toHaveBeenCalled();

        expect(result.pendingToken).toBe('pending-token');
        expect(result.expiresInSec).toBe(600);
    });

    it('should throw if email already verified', async () => {
        await expect(
            service.issueAndSendCode({
                ...user,
                is_email_verified: true,
            }),
        ).rejects.toThrow();
    });

    it('should resend by pending token', async () => {
        configMock.get.mockReturnValue('secret');

        jwtMock.verify.mockReturnValue({
            sub: 1,
            email: 'test@mail.com',
            typ: 'pending_verification',
        });

        userRepoMock.findOne.mockResolvedValue(user);

        repoMock.findOne.mockResolvedValue(null);
        repoMock.create.mockReturnValue({});
        repoMock.save.mockResolvedValue({});

        (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
        jwtMock.sign.mockReturnValue('token');

        const result = await service.resendByPendingToken('token');

        expect(userRepoMock.findOne).toHaveBeenCalledWith({
            where: { id: 1 },
        });

        expect(result.pendingToken).toBe('token');
    });

    it('should verify email successfully', async () => {
        configMock.get.mockReturnValue('secret');

        jwtMock.verify.mockReturnValue({
            sub: 1,
            email: 'test@mail.com',
            typ: 'pending_verification',
        });

        repoMock.findOne.mockResolvedValue({
            user_id: 1,
            code_hash: 'hashed',
            attempts: 0,
            expires_at: new Date(Date.now() + 100000),
        });

        (bcrypt.compare as jest.Mock).mockResolvedValue(true);

        userRepoMock.findOne.mockResolvedValue(user);
        userRepoMock.save.mockResolvedValue({
            ...user,
            is_email_verified: true,
        });

        const result = await service.verifyByPendingToken('token', '123456');

        expect(result.is_email_verified).toBeTruthy();
        expect(userRepoMock.save).toHaveBeenCalled();
    });
});