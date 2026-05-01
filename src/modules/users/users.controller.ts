import {BadRequestException, Controller, Delete, Get, Body, Patch, Param, Post, Query, ParseIntPipe, Req, UploadedFile, UseGuards, UseInterceptors} from '@nestjs/common';
import { UsersService } from './users.service';
import {JwtAuthGuard} from "../auth/guards/jwt-auth.guard";
import {User} from "./entities/user.entity";
import {SearchUsersDto} from "./dto/search-users.dto";
import { UpdateStatusDto } from './dto/update-status.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';



@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req: any): Promise<User> {
    const user = req.user;

    return this.usersService.getUserById(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/email')
  async getMeByEmail(@Req() req: any): Promise<User> {
    const user = req.user;

    return this.usersService.getUserByEmail(user.email);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateMe(@Req() req: any, @Body() body: any) {
    return this.usersService.updateMe(req.user.userId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAllUsers(@Query('role') role?: string): Promise<any> {
    if (role) {
      return this.usersService.getUsersByRole(role);
    }
    return this.usersService.getAllUsers();
  }


  @Get('search')
  async searchUsers(@Query() query: SearchUsersDto) {
    return this.usersService.searchUsers(query.q);
  }

  @Get('online')
  async getOnlineUsers() {
    return this.usersService.getOnlineUsers();
  }

  @Get(':id/status')
  async getUserStatus(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getUserStatus(id);
  }


  @Get(':id')
  async getUserProfile(
      @Param('id', ParseIntPipe) id: number,
  ) {
    return this.usersService.getPublicProfile(id);
  }

  @Delete('me/banner')
  @UseGuards(JwtAuthGuard)
  async deleteMyBanner(@Req() req) {
    return this.usersService.deleteBanner(req.user.userId);
  }

  @Post('me/avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('avatar', {
    storage: memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
  }))
  async uploadMyAvatar(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    if (!file || !file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Image file is required');
    }
    return this.usersService.uploadAvatar(req.user.userId, file);
  }

  @Post('me/banner')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('banner', {
    storage: memoryStorage(),
    limits: { fileSize: 8 * 1024 * 1024 },
  }))
  async uploadMyBanner(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    if (!file || !file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Image file is required');
    }
    return this.usersService.uploadBanner(req.user.userId, file);
  }

  @Patch('me/status')
  @UseGuards(JwtAuthGuard)
  async updateMyStatus(@Req() req: any, @Body() dto: UpdateStatusDto) {
    return this.usersService.updateMyStatus(req.user.userId, dto.status);
  }
}
