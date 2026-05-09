import { Module } from '@nestjs/common';
import { TournamentsService } from './tournaments.service';
import { TournamentsController } from './tournaments.controller';
import {TypeOrmModule} from "@nestjs/typeorm";
import {Tournament} from "./entities/tournament.entity";
import {Team} from "../teams/entities/team.entity";
import { JuryAssignment } from '../jury-assignments/entities/jury-assignment.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { ChatMessagesModule } from '../chat-messages/chat-messages.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tournament, Team, JuryAssignment]),
    NotificationsModule,
    ChatMessagesModule,
  ],
  controllers: [TournamentsController],
  providers: [TournamentsService],
})
export class TournamentsModule {}
