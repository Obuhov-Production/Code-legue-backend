import { Test } from '@nestjs/testing';
import { ChatMessagesController } from './chat-messages.controller';
import { ChatMessagesService } from './chat-messages.service';
import { BadRequestException } from '@nestjs/common';

describe('ChatMessagesController', () => {
    let controller: ChatMessagesController;

    const serviceMock = {
        findByRoom: jest.fn(),
        clearRoom: jest.fn(),
    };

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            controllers: [ChatMessagesController],
            providers: [
                {
                    provide: ChatMessagesService,
                    useValue: serviceMock,
                },
            ],
        }).compile();

        controller = module.get(ChatMessagesController);
    });

    afterEach(() => jest.clearAllMocks());

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('getHistoryByQuery should call service with params', async () => {
        serviceMock.findByRoom.mockResolvedValue(['msg1', 'msg2']);

        const result = await controller.getHistoryByQuery(
            'general',
            '50',
            '10',
        );

        expect(serviceMock.findByRoom).toHaveBeenCalledWith(
            'general',
            50,
            10,
        );

        expect(result).toEqual(['msg1', 'msg2']);
    });

    it('getHistory should call findByRoom', async () => {
        serviceMock.findByRoom.mockResolvedValue([]);

        await controller.getHistory('room1');

        expect(serviceMock.findByRoom).toHaveBeenCalledWith('room1');
    });

    it('clearRoom should call service', async () => {
        serviceMock.clearRoom.mockResolvedValue({ success: true });

        const result = await controller.clearRoom('room1');

        expect(serviceMock.clearRoom).toHaveBeenCalledWith('room1');
        expect(result).toEqual({ success: true });
    });
});