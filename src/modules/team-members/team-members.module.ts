import { Module } from '@nestjs/common';
import { TeamMembersService } from './team-members.service';
import { TeamMembersController } from './team-members.controller';
import {TypeOrmModule} from "@nestjs/typeorm";
import {TeamMember} from "./entities/team-member.entity";
import {Team} from "../teams/entities/team.entity";
import {Tournament} from "../tournaments/entities/tournament.entity";

@Module({
  imports: [TypeOrmModule.forFeature([ TeamMember, Team, Tournament ])],
  controllers: [TeamMembersController],
  providers: [TeamMembersService],
})
export class TeamMembersModule {}
