import { Test } from '@nestjs/testing';
import { ChatReactionsController } from './chat-reactions.controller';
import { ChatReactionsService } from './chat-reactions.service';

describe('ChatReactionsController', () => {
    let controller: ChatReactionsController;

    const serviceMock = {
        findByRoom: jest.fn(),
    };

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            controllers: [ChatReactionsController],
            providers: [
                {
                    provide: ChatReactionsService,
                    useValue: serviceMock,
                },
            ],
        }).compile();

        controller = module.get(ChatReactionsController);
    });

    afterEach(() => jest.clearAllMocks());

    it('should return reactions map', async () => {
        serviceMock.findByRoom.mockResolvedValue({
            '1_👍': { emoji: '👍', count: 1, users: [1] },
        });

        const result = await controller.getReactions('general');

        expect(serviceMock.findByRoom).toHaveBeenCalledWith('general');
        expect(result).toEqual({
            '1_👍': { emoji: '👍', count: 1, users: [1] },
        });
    });
});