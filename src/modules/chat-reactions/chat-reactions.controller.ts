import { Controller, Get, Param } from '@nestjs/common';
import { ChatReactionsService, ReactionMap } from './chat-reactions.service';

@Controller('chat/reactions')
export class ChatReactionsController {
    constructor(private readonly chatReactionsService: ChatReactionsService) {}

    /** GET /api/chat/:room/reactions → { "msgId_emoji": { emoji, count, users: userId[] } } */
    @Get(':room')
    getReactions(@Param('room') room: string): Promise<ReactionMap> {
        return this.chatReactionsService.findByRoom(room);
    }
}
