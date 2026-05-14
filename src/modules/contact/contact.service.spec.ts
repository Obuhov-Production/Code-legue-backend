import { Test } from '@nestjs/testing';
import { ContactService } from './contact.service';
import { ConfigService } from '@nestjs/config';
import { DiscordService } from './discord.service';
import { InternalServerErrorException } from '@nestjs/common';

describe('ContactService', () => {
    let service: ContactService;

    const discordService = {
        send: jest.fn(),
    };

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
                ContactService,
                { provide: ConfigService, useValue: configService },
                { provide: DiscordService, useValue: discordService },
            ],
        }).compile();

        service = module.get(ContactService);
    });

    afterEach(() => jest.clearAllMocks());

    it('should send via Discord by default', async () => {
        configService.get.mockReturnValue('Discord');

        await service.handleContact(dto as any);

        expect(discordService.send).toHaveBeenCalledWith(dto);
    });

    it('should throw if unknown method', async () => {
        configService.get.mockReturnValue('Unknown');

        await expect(service.handleContact(dto as any))
            .rejects
            .toThrow(InternalServerErrorException);
    });
});