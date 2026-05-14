import { Test } from '@nestjs/testing';
import { AdminApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { ApplicationStatus } from './entities/organizer-application.entity';

describe('AdminApplicationsController', () => {
    let controller: AdminApplicationsController;

    const mockService = {
        getAll: jest.fn(),
        reviewOrganizer: jest.fn(),
    };

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            controllers: [AdminApplicationsController],
            providers: [
                { provide: ApplicationsService, useValue: mockService },
            ],
        }).compile();

        controller = module.get(AdminApplicationsController);
    });

    afterEach(() => jest.clearAllMocks());

    it('should get all applications', () => {
        controller.getAll();
        expect(mockService.getAll).toHaveBeenCalled();
    });

    it('should review application', () => {
        controller.review(1, {
            status: ApplicationStatus.APPROVED,
        });

        expect(mockService.reviewOrganizer).toHaveBeenCalledWith(
            1,
            ApplicationStatus.APPROVED,
        );
    });
});