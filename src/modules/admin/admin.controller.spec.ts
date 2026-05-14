import { Test } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

describe('AdminController', () => {
    let controller: AdminController;
    let service: AdminService;

    const mockService = {
        getStats: jest.fn(),
        getUsers: jest.fn(),
        updateUser: jest.fn(),
    };

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            controllers: [AdminController],
            providers: [
                { provide: AdminService, useValue: mockService },
            ],
        }).compile();

        controller = module.get(AdminController);
        service = module.get(AdminService);
    });

    it('should call getStats', () => {
        controller.getStats();
        expect(service.getStats).toHaveBeenCalled();
    });

    it('should call getUsers', () => {
        controller.getUsers();
        expect(service.getUsers).toHaveBeenCalled();
    });
});