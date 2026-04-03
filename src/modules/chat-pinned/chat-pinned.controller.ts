import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ChatPinnedService } from './chat-pinned.service';
import { CreateChatPinnedDto } from './dto/create-chat-pinned.dto';

@Controller('chat-pinned')
export class ChatPinnedController {
  constructor(private readonly chatPinnedService: ChatPinnedService) {}
}
