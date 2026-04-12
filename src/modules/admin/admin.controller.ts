import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/UserRole.enum';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
    constructor(private readonly adminService: AdminService) {}

    @Get('stats')
    getStats() {
        return this.adminService.getStats();
    }

    @Get('users')
    getUsers() {
        return this.adminService.getUsers();
    }

    @Get('chat/muted')
    getMutedUsers() {
        return this.adminService.getMutedUsers();
    }

    @Patch('users/:id')
    updateUser(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: { role?: string; is_chat_muted?: boolean },
    ) {
        return this.adminService.updateUser(id, body);
    }

    @Delete('users/:id')
    deleteUser(@Param('id', ParseIntPipe) id: number) {
        return this.adminService.deleteUser(id);
    }
}
