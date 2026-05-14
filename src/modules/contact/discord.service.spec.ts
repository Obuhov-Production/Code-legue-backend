import { Test } from '@nestjs/testing';
import { DiscordService } from './discord.service';
import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException } from '@nestjs/common';

describe('DiscordService', () => {
    let service: DiscordService;

    const configService = {
        get: jest.fn(),
    };

    const dto = {
        name: 'John',
        email: 'john@test.com',
        message: 'Hello',
        type: 'contact',
    };

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [
                DiscordService,
                { provide: ConfigService, useValue: configService },
            ],
        }).compile();

        service = module.get(DiscordService);
    });

    beforeEach(() => {
        global.fetch = jest.fn() as any;
    });

    afterEach(() => jest.clearAllMocks());

    it('should throw if webhook missing', async () => {
        configService.get.mockReturnValue(undefined);

        await expect(service.send(dto as any))
            .rejects
            .toThrow(InternalServerErrorException);
    });

    it('should send payload to Discord', async () => {
        configService.get.mockReturnValue('https://discord.webhook');

        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
        });

        await service.send(dto as any);

        expect(global.fetch).toHaveBeenCalled();
    });

    it('should throw if Discord fails', async () => {
        configService.get.mockReturnValue('https://discord.webhook');

        (global.fetch as jest.Mock).mockResolvedValue({
            ok: false,
            status: 500,
            text: async () => 'error',
        });

        await expect(service.send(dto as any))
            .rejects
            .toThrow(InternalServerErrorException);
    });
});