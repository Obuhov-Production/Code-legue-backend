import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/UserRole.enum';
import {UpdatePasswordDto} from "./dto/update-password.dto";
import { SearchUsersDto } from './dto/search-users.dto';
import { BulkUserActionDto } from './dto/bulk-user-action.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
    constructor(private readonly adminService: AdminService) {}

    @Get('stats')
    getStats() {
        return this.adminService.getStats();
    }

    @Get('users/daily-stats')
    getUserDailyStats(@Query('days') days = '7') {
        return this.adminService.getUserDailyStats(parseInt(days, 10) || 7);
    }

    @Get('users')
    getUsers() {
        return this.adminService.getUsers();
    }

    @Get('users/search')
    searchUsers(@Query() query: SearchUsersDto) {
        return this.adminService.searchUsers(query);
    }

    @Get('chat/muted')
    getMutedUsers() {
        return this.adminService.getMutedUsers();
    }

    @Patch('users/:id')
    updateUser(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: { role?: string; is_chat_muted?: boolean; status?: string },
    ) {
        return this.adminService.updateUser(id, body);
    }

    @Patch('users/bulk')
    bulkAction(@Body() dto: BulkUserActionDto) {
        return this.adminService.bulkAction(dto);
    }

    @Delete('users/:id')
    deleteUser(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
        return this.adminService.deleteUser(id, (req.user as any).userId);
    }

    @Patch(':id/password')
    async resetPassword(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdatePasswordDto,
    ) {
        return this.adminService.resetUserPassword(id, dto.password);
    }

    @Get('teams')
    getTeams() {
        return this.adminService.getTeams();
    }

    @Delete('teams/:id')
    deleteTeam(@Param('id', ParseIntPipe) id: number) {
        return this.adminService.deleteTeam(id);
    }

    @Get('chat/settings/:room')
    getChatSettings(@Param('room') room: string) {
        return this.adminService.getChatSettings(room);
    }

    @Patch('chat/settings/:room')
    updateChatSettings(
        @Param('room') room: string,
        @Body() body: { locked?: number; time_from?: string | null; time_to?: string | null },
    ) {
        return this.adminService.updateChatSettings(room, body);
    }
}
