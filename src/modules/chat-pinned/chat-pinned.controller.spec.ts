import { Test } from '@nestjs/testing';
import { ChatPinnedController } from './chat-pinned.controller';
import { ChatPinnedService } from './chat-pinned.service';

describe('ChatPinnedController', () => {
    let controller: ChatPinnedController;

    const serviceMock = {
        findByRoom: jest.fn(),
    };

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            controllers: [ChatPinnedController],
            providers: [
                {
                    provide: ChatPinnedService,
                    useValue: serviceMock,
                },
            ],
        }).compile();

        controller = module.get(ChatPinnedController);
    });

    afterEach(() => jest.clearAllMocks());

    it('should return pinned messages', async () => {
        serviceMock.findByRoom.mockResolvedValue([{ id: 1 }]);

        const result = await controller.getPinned('general');

        expect(serviceMock.findByRoom).toHaveBeenCalledWith('general');
        expect(result).toEqual([{ id: 1 }]);
    });
});