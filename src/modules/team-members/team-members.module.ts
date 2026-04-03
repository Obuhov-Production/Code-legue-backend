import { Module } from '@nestjs/common';
import { TeamMembersService } from './team-members.service';
import { TeamMembersController } from './team-members.controller';
import {TypeOrmModule} from "@nestjs/typeorm";
import {TeamMember} from "./entities/team-member.entity";

@Module({
  imports: [TypeOrmModule.forFeature([ TeamMember ])],
  controllers: [TeamMembersController],
  providers: [TeamMembersService],
})
export class TeamMembersModule {}
