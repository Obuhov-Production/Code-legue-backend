import { Module } from '@nestjs/common';
import { TournamentsService } from './tournaments.service';
import { TournamentsController } from './tournaments.controller';
import {TypeOrmModule} from "@nestjs/typeorm";
import {Tournament} from "./entities/tournament.entity";
import {Team} from "../teams/entities/team.entity";
import {TeamMember} from "../team-members/entities/team-member.entity";
import {Round} from "../rounds/entities/round.entity";
import {User} from "../users/entities/user.entity";
import { JuryAssignment } from '../jury-assignments/entities/jury-assignment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tournament, Team, JuryAssignment])],
  controllers: [TournamentsController],
  providers: [TournamentsService],
})
export class TournamentsModule {}
