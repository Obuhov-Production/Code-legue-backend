import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard)
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
}
