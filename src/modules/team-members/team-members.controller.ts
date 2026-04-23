import {Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req} from '@nestjs/common';
import { TeamMembersService } from './team-members.service';
import {JwtAuthGuard} from "../auth/guards/jwt-auth.guard";
import {AddTeamMemberDto} from "./dto/add-team-member.dto";

@Controller('team-members')
export class TeamMembersController {
  constructor(private readonly teamMembersService: TeamMembersService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async addMember(@Body() dto: AddTeamMemberDto, @Req() req) {
    return this.teamMembersService.addMember(dto, req.user);
  }
}
