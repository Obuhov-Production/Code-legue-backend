import { Module } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { TeamsController } from './teams.controller';
import {TypeOrmModule} from "@nestjs/typeorm";
import {Team} from "./entities/team.entity";
import {Tournament} from "../tournaments/entities/tournament.entity";
import {TeamMember} from "../team-members/entities/team-member.entity";
import {User} from "../users/entities/user.entity";
import { TournamentRepository } from './entities/tournament-repository.entity';
import { CodeReview } from './entities/code-review.entity';
import { ChatRoomMember } from './entities/chat-room-member.entity';
import { Badge } from '../badges/entities/badge.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { ChatRoom } from '../chat-room/entities/chat-room.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Team, TeamMember, Tournament, User, TournamentRepository, CodeReview, ChatRoomMember, Badge, ChatRoom]),
    NotificationsModule,
  ],
    controllers: [TeamsController],
  providers: [TeamsService],
  exports: [TeamsService],
})
export class TeamsModule {}
