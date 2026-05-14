import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EmailVerificationService } from '../email-verification/email-verification.service';
import { MailService } from '../mail/mail.service';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

const mockRepo = () => ({
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
});

describe('AuthService', () => {
    let service: AuthService;
    let repo: any;

    const jwtServiceMock = {
        sign: jest.fn(),
        verify: jest.fn(),
        verifyAsync: jest.fn(),
    };

    const configServiceMock = {
        get: jest.fn(),
    };

    const emailVerificationMock = {
        issueAndSendCode: jest.fn(),
        verifyByPendingToken: jest.fn(),
        resendByPendingToken: jest.fn(),
    };

    const mailServiceMock = {
        send: jest.fn(),
    };

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: getRepositoryToken(User),
                    useValue: mockRepo(),
                },
                { provide: JwtService, useValue: jwtServiceMock },
                { provide: ConfigService, useValue: configServiceMock },
                { provide: EmailVerificationService, useValue: emailVerificationMock },
                { provide: MailService, useValue: mailServiceMock },
            ],
        }).compile();

        service = module.get(AuthService);
        repo = module.get(getRepositoryToken(User));

        jest.clearAllMocks();
    });

    it('should register user and return pending verification', async () => {
        repo.findOne.mockResolvedValue(null);
        repo.create.mockReturnValue({ email: 'test@test.com' });
        repo.save.mockResolvedValue({
            id: 1,
            email: 'test@test.com',
        });

        emailVerificationMock.issueAndSendCode.mockResolvedValue({
            pendingToken: 'token',
            expiresInSec: 600,
        });

        const result = await service.create({
            email: 'test@test.com',
            username: 'test',
            password: '12345678',
        } as any);

        expect(result.requiresVerification).toBe(true);
        expect(repo.save).toHaveBeenCalled();
    });

    it('should login user and return tokens', async () => {
        const hashed = await bcrypt.hash('12345678', 10);

        repo.findOne.mockResolvedValue({
            id: 1,
            email: 'test@test.com',
            username: 'test',
            password: hashed,
            role: 'user',
            is_email_verified: true,
        });

        jwtServiceMock.sign
            .mockReturnValueOnce('access-token')
            .mockReturnValueOnce('refresh-token');

        const result = (await service.login({
            email: 'test@test.com',
            password: '12345678',
        } as any)) as any;

        expect(result.accessToken).toBeDefined();
        expect(result.refreshToken).toBeDefined();
        expect(result.user).toBeDefined();
    });

    it('should throw on invalid login', async () => {
        repo.findOne.mockResolvedValue(null);

        await expect(
            service.login({ email: 'x', password: 'y' } as any),
        ).rejects.toThrow(UnauthorizedException);
    });

    it('should return me', async () => {
        repo.findOne.mockResolvedValue({
            id: 1,
            email: 'test@test.com',
            password: 'x',
        });

        const result = await service.getMe(1);

        expect(result.email).toBe('test@test.com');
    });

    it('should throw if user not found in getMe', async () => {
        repo.findOne.mockResolvedValue(null);

        await expect(service.getMe(1)).rejects.toThrow(UnauthorizedException);
    });

    it('should refresh token', async () => {
        jwtServiceMock.verifyAsync.mockResolvedValue({ userId: 1 });

        repo.findOne.mockResolvedValue({
            id: 1,
            username: 'test',
            email: 'test@test.com',
            role: 'user',
        });

        jwtServiceMock.sign.mockReturnValue('new-token');

        const result = await service.refresh('refresh');

        expect(result.accessToken).toBe('new-token');
    });
});