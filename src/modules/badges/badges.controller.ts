import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import { BadgesService } from './badges.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/UserRole.enum';

// ── User controller: GET /badges/my ────────────────────────────────────────
@UseGuards(JwtAuthGuard)
@Controller('badges')
export class BadgesController {
    constructor(private readonly badgesService: BadgesService) {}

    @Get('my')
    getMyBadges(@Req() req: any) {
        return this.badgesService.getMyBadges(req.user.userId);
    }
}

// ── Admin controller: full CRUD on /admin/users/:id/badges ─────────────────
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/users/:id/badges')
export class AdminBadgesController {
    constructor(private readonly badgesService: BadgesService) {}

    @Get()
    getBadges(@Param('id', ParseIntPipe) id: number) {
        return this.badgesService.getBadgesByUser(id);
    }

    @Post()
    grantBadge(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: { name: string; icon_url?: string; description?: string },
    ) {
        return this.badgesService.grantBadge(id, body);
    }

    @Delete(':badgeId')
    deleteBadge(
        @Param('id', ParseIntPipe) id: number,
        @Param('badgeId', ParseIntPipe) badgeId: number,
    ) {
        return this.badgesService.deleteBadge(badgeId, id);
    }
}
