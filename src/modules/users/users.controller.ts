import {Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req} from '@nestjs/common';
import { UsersService } from './users.service';
import {JwtAuthGuard} from "../auth/guards/jwt-auth.guard";
import {User} from "./entities/user.entity";



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
  @Get()
  async getAllUsers(): Promise<User[]> {
    return this.usersService.getAllUsers();
  }

}
