import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ChatRoomSettingsService } from './chat-room-settings.service';
import { CreateChatRoomSettingDto } from './dto/create-chat-room-setting.dto';

@Controller('chat-room-settings')
export class ChatRoomSettingsController {
  constructor(private readonly chatRoomSettingsService: ChatRoomSettingsService) {}

}
