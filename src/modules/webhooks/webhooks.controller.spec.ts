import { Test } from '@nestjs/testing';
import { WebhooksController } from './webhooks.controller';
import { TeamsService } from '../teams/teams.service';

describe('WebhooksController', () => {
    let controller: WebhooksController;

    const mockTeamsService = {
        applyGithubWebhook: jest.fn(),
    };

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            controllers: [WebhooksController],
            providers: [
                { provide: TeamsService, useValue: mockTeamsService },
            ],
        }).compile();

        controller = module.get(WebhooksController);
    });

    afterEach(() => jest.clearAllMocks());

    it('should call applyGithubWebhook', async () => {
        const payload = { action: 'push' };

        mockTeamsService.applyGithubWebhook.mockResolvedValue({ ok: true });

        const result = await controller.handleGithubWebhook(payload);

        expect(mockTeamsService.applyGithubWebhook).toHaveBeenCalledWith(payload);
        expect(result).toEqual({ ok: true });
    });
});