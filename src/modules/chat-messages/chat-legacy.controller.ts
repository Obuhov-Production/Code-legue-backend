import { Controller, Delete, ForbiddenException, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ChatMessagesService } from './chat-messages.service';
import { ChatReactionsService } from '../chat-reactions/chat-reactions.service';
import { ChatPinnedService } from '../chat-pinned/chat-pinned.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/UserRole.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatRoomMember } from '../teams/entities/chat-room-member.entity';
import { Repository } from 'typeorm';

@Controller()
export class ChatLegacyController {
    constructor(
        private readonly chatMessagesService: ChatMessagesService,
        private readonly chatReactionsService: ChatReactionsService,
        private readonly chatPinnedService: ChatPinnedService,
        @InjectRepository(ChatRoomMember) private readonly chatRoomMemberRepo: Repository<ChatRoomMember>,
    ) {}

    private async assertRoomAccess(room: string, user: any) {
        if (!room?.startsWith('team_')) return;
        if (String(user?.role || '').includes(UserRole.ADMIN)) return;
        const userId = user?.userId;
        if (!userId) throw new ForbiddenException('Forbidden');
        const membership = await this.chatRoomMemberRepo.findOne({ where: { room, user_id: userId } });
        if (!membership) throw new ForbiddenException('Forbidden');
    }

    @Get('chat-messages')
    @UseGuards(JwtAuthGuard)
    async getHistoryLegacy(@Query('room') room: string, @Req() req: any) {
        await this.assertRoomAccess(room, req.user);
        return this.chatMessagesService.findByRoom(room);
    }

    @Get('chat/:room/reactions')
    @UseGuards(JwtAuthGuard)
    async getReactionsLegacy(@Param('room') room: string, @Req() req: any) {
        await this.assertRoomAccess(room, req.user);
        return this.chatReactionsService.findByRoom(room);
    }

    @Get('chat/:room/pinned')
    @UseGuards(JwtAuthGuard)
    async getPinnedLegacy(@Param('room') room: string, @Req() req: any) {
        await this.assertRoomAccess(room, req.user);
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
