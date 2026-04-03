import { Module } from '@nestjs/common';
import { ChatRoomSettingsService } from './chat-room-settings.service';
import { ChatRoomSettingsController } from './chat-room-settings.controller';
import {TypeOrmModule} from "@nestjs/typeorm";
import {ChatRoomSettings} from "./entities/chat-room-setting.entity";

@Module({
  imports: [TypeOrmModule.forFeature([ ChatRoomSettings ])],
  controllers: [ChatRoomSettingsController],
  providers: [ChatRoomSettingsService],
})
export class ChatRoomSettingsModule {}
