import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ChatReactionsService } from './chat-reactions.service';
import { CreateChatReactionDto } from './dto/create-chat-reaction.dto';

@Controller('chat-reactions')
export class ChatReactionsController {
  constructor(private readonly chatReactionsService: ChatReactionsService) {}

}
