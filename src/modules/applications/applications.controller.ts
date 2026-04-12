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

@Controller('applications')
@UseGuards(JwtAuthGuard)
export class ApplicationsController {
    constructor(private readonly applicationsService: ApplicationsService) {}

    @Post('organizer')
    submit(@Request() req, @Body() body: { motivation: string }) {
        return this.applicationsService.submitOrganizer(req.user.userId, body.motivation);
    }

    @Get('organizer/my')
    getMy(@Request() req) {
        return this.applicationsService.getMyApplication(req.user.userId);
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
        @Body() body: { status: 'approved' | 'rejected'; adminComment?: string },
    ) {
        return this.applicationsService.review(id, body.status, body.adminComment);
    }
}
