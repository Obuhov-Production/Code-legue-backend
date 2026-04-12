import { Controller, Get, Param } from '@nestjs/common';
import { ChatMessagesService } from './chat-messages.service';

@Controller('chat')
export class ChatMessagesController {
    constructor(private readonly chatMessagesService: ChatMessagesService) {}

    @Get(':room')
    getHistory(@Param('room') room: string) {
        return this.chatMessagesService.findByRoom(room);
    }
}
