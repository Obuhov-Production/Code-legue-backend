import { Controller, Get, Param, Query } from '@nestjs/common';
import { ChatMessagesService } from './chat-messages.service';
import { ChatReactionsService } from '../chat-reactions/chat-reactions.service';
import { ChatPinnedService } from '../chat-pinned/chat-pinned.service';

@Controller()
export class ChatLegacyController {
    constructor(
        private readonly chatMessagesService: ChatMessagesService,
        private readonly chatReactionsService: ChatReactionsService,
        private readonly chatPinnedService: ChatPinnedService,
    ) {}

    @Get('chat-messages')
    getHistoryLegacy(@Query('room') room: string) {
        return this.chatMessagesService.findByRoom(room);
    }

    @Get('chat/:room/reactions')
    getReactionsLegacy(@Param('room') room: string) {
        return this.chatReactionsService.findByRoom(room);
    }

    @Get('chat/:room/pinned')
    getPinnedLegacy(@Param('room') room: string) {
        return this.chatPinnedService.findByRoom(room);
    }

    @Get('chat/custom-rooms')
    getCustomRooms() {
        return this.chatMessagesService.getCustomRooms();
    }
}
