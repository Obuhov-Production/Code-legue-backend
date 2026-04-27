import {
    Body,
    Controller,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Request,
    UseGuards,
} from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/UserRole.enum';
import {ReviewApplicationDto} from "./dto/review-application.dto";
import {SubmitOrganizerDto} from "./dto/submit-organizer.dto";

@Controller('applications')
@UseGuards(JwtAuthGuard)
export class ApplicationsController {
    constructor(private readonly applicationsService: ApplicationsService) {}

    @Post('organizer')
    submit(
        @Request() req,
        @Body() body: SubmitOrganizerDto,
    ) {
        return this.applicationsService.submitOrganizer(
            req.user.userId,
            body.motivation,
            body.experience,
            body.contact_email,
            body.contact_telegram,
            body.contact_phone,
        );
    }

    @Get('organizer/my')
    async getMy(@Request() req) {
        const app = await this.applicationsService.getMyApplication(req.user.userId);
        return app ?? { hasApplication: false };
    }
}

@Controller('admin/applications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminApplicationsController {
    constructor(private readonly applicationsService: ApplicationsService) {}

    @Get('organizer')
    getAll() {
        return this.applicationsService.getAll();
    }

    @Patch('organizer/:id')
    review(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: ReviewApplicationDto,
    ) {
        return this.applicationsService.reviewOrganizer(
            id,
            dto.status,
        );
    }
}
