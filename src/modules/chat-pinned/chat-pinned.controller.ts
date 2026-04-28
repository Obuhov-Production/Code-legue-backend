import { Controller, Get, Param } from '@nestjs/common';
import { ChatPinnedService } from './chat-pinned.service';

@Controller('chat/pinned')
export class ChatPinnedController {
    constructor(private readonly chatPinnedService: ChatPinnedService) {}

    @Get(':room')
    getPinned(@Param('room') room: string) {
        return this.chatPinnedService.findByRoom(room);
    }
}
