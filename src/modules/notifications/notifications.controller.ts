import { Controller, Delete, Get, Param, ParseIntPipe, Patch, Req, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) {}

    @Get()
    getMyNotifications(@Req() req: any) {
        return this.notificationsService.findForUser(req.user.userId);
    }

    @Patch(':id/read')
    markRead(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
        return this.notificationsService.markRead(id, req.user.userId);
    }

    @Patch('read-all')
    markAllRead(@Req() req: any) {
        return this.notificationsService.markAllRead(req.user.userId);
    }

    @Delete()
    removeAll(@Req() req: any) {
        return this.notificationsService.removeAll(req.user.userId);
    }

    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
        return this.notificationsService.remove(id, req.user.userId);
    }
}
