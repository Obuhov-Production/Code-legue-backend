import {Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query, ParseIntPipe} from '@nestjs/common';
import { UsersService } from './users.service';
import {JwtAuthGuard} from "../auth/guards/jwt-auth.guard";
import {User} from "./entities/user.entity";
import {SearchUsersDto} from "./dto/search-users.dto";



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
  async getAllUsers(): Promise<User[]> {
    return this.usersService.getAllUsers();
  }


  @Get('search')
  async searchUsers(@Query() query: SearchUsersDto) {
    return this.usersService.searchUsers(query.q);
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
}
