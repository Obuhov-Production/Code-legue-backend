import { Module } from '@nestjs/common';
import { TournamentsService } from './tournaments.service';
import { TournamentsController } from './tournaments.controller';
import {TypeOrmModule} from "@nestjs/typeorm";
import {Tournament} from "./entities/tournament.entity";
import {Team} from "../teams/entities/team.entity";
import { ChatRoom } from '../chat-room/entities/chat-room.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { ChatMessagesModule } from '../chat-messages/chat-messages.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tournament, Team, ChatRoom, User]),
    NotificationsModule,
    ChatMessagesModule,
  ],
  controllers: [TournamentsController],
  providers: [TournamentsService],
})
export class TournamentsModule {}
