import { Module } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { AnnouncementsController } from './announcements.controller';
import {TypeOrmModule} from "@nestjs/typeorm";
import {Message} from "../chat-messages/entities/chat-message.entity";
import {Announcement} from "./entities/announcement.entity";

@Module({
  imports: [TypeOrmModule.forFeature([ Announcement ])],
  controllers: [AnnouncementsController],
  providers: [AnnouncementsService],
})
export class AnnouncementsModule {}
