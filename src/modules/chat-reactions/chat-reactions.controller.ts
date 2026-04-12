import { Controller, Get, Param } from '@nestjs/common';
import { ChatReactionsService } from './chat-reactions.service';

@Controller('chat')
export class ChatReactionsController {
    constructor(private readonly chatReactionsService: ChatReactionsService) {}

    @Get(':room/reactions')
    getReactions(@Param('room') room: string) {
        return this.chatReactionsService.findByRoom(room);
    }
}
