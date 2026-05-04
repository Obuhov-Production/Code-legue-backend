import { Controller, Delete, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ChatMessagesService } from './chat-messages.service';
import { ChatReactionsService } from '../chat-reactions/chat-reactions.service';
import { ChatPinnedService } from '../chat-pinned/chat-pinned.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/UserRole.enum';

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

    @Delete('chat/:room/clear')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    clearRoom(@Param('room') room: string) {
        return this.chatMessagesService.clearRoom(room);
    }
}
