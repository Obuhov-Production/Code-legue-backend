import { Module } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { TeamsController } from './teams.controller';
import {TypeOrmModule} from "@nestjs/typeorm";
import {Team} from "./entities/team.entity";
import {Tournament} from "../tournaments/entities/tournament.entity";
import {TeamMember} from "../team-members/entities/team-member.entity";
import {Submission} from "../submissions/entities/submission.entity";
import {User} from "../users/entities/user.entity";

@Module({
  imports: [TypeOrmModule.forFeature([ Team ])],
    controllers: [TeamsController],
  providers: [TeamsService],
})
export class TeamsModule {}
