import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

import { MailService } from './mail.service';

jest.mock('nodemailer', () => ({
    createTransport: jest.fn(),
}));

import * as nodemailer from 'nodemailer';

describe('MailService', () => {
    let service: MailService;

    const mockConfigService = {
        get: jest.fn(),
    };

    const mockTransporter = {
        verify: jest.fn(),
        sendMail: jest.fn(),
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        (nodemailer.createTransport as jest.Mock).mockReturnValue(
            mockTransporter,
        );

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MailService,
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
            ],
        }).compile();

        service = module.get<MailService>(MailService);
    });

    describe('onModuleInit', () => {
        it('should create transporter when smtp credentials exist', async () => {
            mockConfigService.get.mockImplementation((key: string) => {
                const map = {
                    MAIL_APP_NAME: 'Test App',
                    SMTP_HOST: 'smtp.gmail.com',
                    SMTP_PORT: '465',
                    SMTP_SECURE: 'true',
                    SMTP_USER: 'test@gmail.com',
                    SMTP_PASS: 'password',
                };

                return map[key];
            });

            mockTransporter.verify.mockResolvedValue(true);

            service.onModuleInit();

            expect(nodemailer.createTransport).toHaveBeenCalledWith({
                host: 'smtp.gmail.com',
                port: 465,
                secure: true,
                auth: {
                    user: 'test@gmail.com',
                    pass: 'password',
                },
            });

            expect(mockTransporter.verify).toHaveBeenCalled();
        });

        it('should not create transporter without credentials', () => {
            mockConfigService.get.mockImplementation((key: string) => {
                const map = {
                    SMTP_USER: null,
                    SMTP_PASS: null,
                };

                return map[key];
            });

            const warnSpy = jest
                .spyOn(Logger.prototype, 'warn')
                .mockImplementation();

            service.onModuleInit();

            expect(warnSpy).toHaveBeenCalled();
            expect(nodemailer.createTransport).not.toHaveBeenCalled();
        });
    });

    describe('send', () => {
        it('should send email', async () => {
            mockConfigService.get.mockImplementation((key: string) => {
                const map = {
                    MAIL_FROM_NAME: 'Code League',
                    MAIL_FROM: 'from@test.com',
                };

                return map[key];
            });

            (service as any).transporter = mockTransporter;

            mockTransporter.sendMail.mockResolvedValue(true);

            await service.send({
                to: 'user@test.com',
                subject: 'Test',
                html: '<b>Hello</b>',
                text: 'Hello',
            });

            expect(mockTransporter.sendMail).toHaveBeenCalledWith({
                from: '"Code League" <from@test.com>',
                to: 'user@test.com',
                subject: 'Test',
                html: '<b>Hello</b>',
                text: 'Hello',
            });
        });

        it('should dry-run when transporter does not exist', async () => {
            const warnSpy = jest
                .spyOn(Logger.prototype, 'warn')
                .mockImplementation();

            await service.send({
                to: 'user@test.com',
                subject: 'Test',
                html: '<b>Hello</b>',
            });

            expect(warnSpy).toHaveBeenCalled();
        });

        it('should throw when sendMail fails', async () => {
            (service as any).transporter = mockTransporter;

            mockTransporter.sendMail.mockRejectedValue(
                new Error('SMTP error'),
            );

            await expect(
                service.send({
                    to: 'user@test.com',
                    subject: 'Test',
                    html: '<b>Hello</b>',
                }),
            ).rejects.toThrow('SMTP error');
        });
    });

    describe('sendVerificationCode', () => {
        it('should send verification email', async () => {
            const sendSpy = jest
                .spyOn(service, 'send')
                .mockResolvedValue();

            (service as any).appName = 'Code League';

            await service.sendVerificationCode(
                'user@test.com',
                '123456',
                15,
            );

            expect(sendSpy).toHaveBeenCalled();

            expect(sendSpy.mock.calls[0][0].to).toBe('user@test.com');

            expect(sendSpy.mock.calls[0][0].subject).toContain('123456');
        });
    });
});