import { Test } from '@nestjs/testing';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { BadRequestException } from '@nestjs/common';

describe('AiController', () => {
    let controller: AiController;

    const mockService = {
        chat: jest.fn(),
    };

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            controllers: [AiController],
            providers: [
                { provide: AiService, useValue: mockService },
            ],
        }).compile();

        controller = module.get(AiController);
    });

    afterEach(() => jest.clearAllMocks());

    it('should throw if messages is not array', async () => {
        await expect(controller.chat(null as any))
            .rejects.toThrow(BadRequestException);
    });

    it('should throw if messages empty', async () => {
        await expect(controller.chat([]))
            .rejects.toThrow(BadRequestException);
    });

    it('should call service.chat and return response', async () => {
        mockService.chat.mockResolvedValue('Hello AI');

        const result = await controller.chat([
            { role: 'user', content: 'Hi' },
        ]);

        expect(mockService.chat).toHaveBeenCalled();
        expect(result).toEqual({ message: 'Hello AI' });
    });
});