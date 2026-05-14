import { Test } from '@nestjs/testing';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';

describe('ApplicationsController', () => {
    let controller: ApplicationsController;

    const mockService = {
        submitOrganizer: jest.fn(),
        getMyApplication: jest.fn(),
    };

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            controllers: [ApplicationsController],
            providers: [
                { provide: ApplicationsService, useValue: mockService },
            ],
        }).compile();

        controller = module.get(ApplicationsController);
    });

    afterEach(() => jest.clearAllMocks());

    it('should submit organizer application', async () => {
        mockService.submitOrganizer.mockResolvedValue({ id: 1 });

        const req = { user: { userId: 10 } };

        const result = await controller.submit(req as any, {
            motivation: 'I want to help',
            experience: 'none',
            contact_email: 'a@a.com',
            contact_telegram: '@tg',
            contact_phone: '123',
        } as any);

        expect(mockService.submitOrganizer).toHaveBeenCalledWith(
            10,
            'I want to help',
            'none',
            'a@a.com',
            '@tg',
            '123',
        );

        expect(result).toEqual({ id: 1 });
    });

    it('should return my application or fallback', async () => {
        mockService.getMyApplication.mockResolvedValue(null);

        const result = await controller.getMy({ user: { userId: 5 } } as any);

        expect(result).toEqual({ hasApplication: false });
    });
});