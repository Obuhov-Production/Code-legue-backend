import { Controller, Get, Param } from '@nestjs/common';
import { ChatPinnedService } from './chat-pinned.service';

@Controller('chat')
export class ChatPinnedController {
    constructor(private readonly chatPinnedService: ChatPinnedService) {}

    @Get(':room/pinned')
    getPinned(@Param('room') room: string) {
        return this.chatPinnedService.findByRoom(room);
    }
}
