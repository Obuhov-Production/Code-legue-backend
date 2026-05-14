import { Test } from '@nestjs/testing';
import { AnnouncementsController } from './announcements.controller';
import { AnnouncementsService } from './announcements.service';

describe('AnnouncementsController', () => {
    let controller: AnnouncementsController;

    const mockService = {
        create: jest.fn(),
        remove: jest.fn(),
    };

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            controllers: [AnnouncementsController],
            providers: [
                { provide: AnnouncementsService, useValue: mockService },
            ],
        }).compile();

        controller = module.get(AnnouncementsController);
    });

    afterEach(() => jest.clearAllMocks());

    it('should call create', async () => {
        mockService.create.mockResolvedValue({ id: 1 });

        const result = await controller.create(1, 'title', 'msg');

        expect(mockService.create).toHaveBeenCalledWith(
            1,
            'title',
            'msg',
        );

        expect(result).toEqual({ id: 1 });
    });

    it('should call remove', async () => {
        mockService.remove.mockResolvedValue({ message: 'ok' });

        const result = await controller.remove(5);

        expect(mockService.remove).toHaveBeenCalledWith(5);
        expect(result).toEqual({ message: 'ok' });
    });
});