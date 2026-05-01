import { Module } from '@nestjs/common';
import { SubmissionsService } from './submissions.service';
import { SubmissionsController } from './submissions.controller';
import {TypeOrmModule} from "@nestjs/typeorm";
import {Round} from "../rounds/entities/round.entity";
import {Team} from "../teams/entities/team.entity";
import {JuryAssignment} from "../jury-assignments/entities/jury-assignment.entity";
import {Submission} from "./entities/submission.entity";
import { TeamMember } from '../team-members/entities/team-member.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Submission, Round, Team, JuryAssignment, TeamMember])],
  controllers: [SubmissionsController],
  providers: [SubmissionsService],
  exports: [SubmissionsService],
})
export class SubmissionsModule {}
