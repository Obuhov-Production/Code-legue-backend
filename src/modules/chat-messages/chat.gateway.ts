import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ChatMessagesService } from './chat-messages.service';
import { ChatReactionsService } from '../chat-reactions/chat-reactions.service';
import { ChatPinnedService } from '../chat-pinned/chat-pinned.service';
import { UsersService } from '../users/users.service';
import { PlatformUserStatus } from '../users/dto/update-status.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatRoomMember } from '../teams/entities/chat-room-member.entity';

interface AuthSocket extends Socket {
    userId?: number;
    username?: string;
    role?: string;
    first_name?: string;
    last_name?: string;
    pinned_badge?: string;
}

@WebSocketGateway({
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
    },
    namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly statusTimeoutMs = 5 * 60 * 1000;
    private readonly userConnections = new Map<number, number>();

    constructor(
        private readonly chatMessagesService: ChatMessagesService,
        private readonly chatReactionsService: ChatReactionsService,
        private readonly chatPinnedService: ChatPinnedService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly usersService: UsersService,
        @InjectRepository(ChatRoomMember) private readonly chatRoomMemberRepo: Repository<ChatRoomMember>,
    ) {}

    async handleConnection(client: AuthSocket) {
        try {
            const raw = client.handshake.auth?.token || client.handshake.headers?.authorization;

            if (!raw) {
                client.emit('error', { message: 'Unauthorized' });
                client.disconnect();
                return;
            }

            const token = String(raw).replace(/^Bearer\s+/i, '');
            const payload = this.jwtService.verify(token, {
                secret: this.configService.get<string>('JWT_SECRET'),
            });

            const role = payload.role ?? 'user';
            if (role.includes('banned')) {
                client.emit('error', { message: 'Акаунт заблоковано' });
                client.disconnect();
                return;
            }

            client.userId = payload.userId;
            client.username = payload.username;
            client.role = role;
            client.first_name = payload.first_name ?? null;
            client.last_name = payload.last_name ?? null;
            client.pinned_badge = payload.pinned_badge ?? null;

            client.join(`user_${payload.userId}`);
            this.userConnections.set(payload.userId, (this.userConnections.get(payload.userId) ?? 0) + 1);

            const presence = await this.usersService.updatePresence(payload.userId, PlatformUserStatus.ONLINE);
            this.server.emit('status:changed', {
                user_id: presence.id,
                status: presence.status,
                timestamp: presence.last_seen_at,
            });

            console.log(`[WS] connected: ${client.username} (${client.id})`);
            client.emit('connected', { userId: payload.userId, username: payload.username });
        } catch (e) {
            console.error('[WS] auth error:', e?.message);
            client.emit('error', { message: 'Invalid token' });
            client.disconnect();
        }
    }

    handleDisconnect(client: AuthSocket) {
        if (client.userId) {
            const nextCount = Math.max(0, (this.userConnections.get(client.userId) ?? 1) - 1);
            if (nextCount === 0) {
                this.userConnections.delete(client.userId);
                setTimeout(async () => {
                    if ((this.userConnections.get(client.userId!) ?? 0) === 0) {
                        const presence = await this.usersService.updatePresence(client.userId!, PlatformUserStatus.OFFLINE);
                        this.server.emit('status:changed', {
                            user_id: presence.id,
                            status: presence.status,
                            timestamp: presence.last_seen_at,
                        });
                    }
                }, this.statusTimeoutMs);
            } else {
                this.userConnections.set(client.userId, nextCount);
            }
        }

        const rooms = Array.from(client.rooms).filter((r) => r !== client.id);
        rooms.forEach((room) => {
            client.to(room).emit('user:left', { userId: client.userId, username: client.username });
        });
    }

    private async canAccessRoom(client: AuthSocket, room: string): Promise<boolean> {
        if (!room?.startsWith('team_')) return true;
        if (client.role?.includes('admin')) return true;
        if (!client.userId) return false;

        const membership = await this.chatRoomMemberRepo.findOne({
            where: { room, user_id: client.userId },
        });

        return !!membership;
    }
    @SubscribeMessage('room:join')
    async handleJoinRoom(
        @ConnectedSocket() client: AuthSocket,
        @MessageBody() data: { room: string },
    ) {
        const { room } = data;

        if (!(await this.canAccessRoom(client, room))) {
            client.emit('error', { message: 'Forbidden' });
            return;
        }

        await client.join(room);
        console.log(`[WS] ${client.username} joined room: ${room}`);

        const history = await this.chatMessagesService.findByRoom(room);
        client.emit('room:history', { room, messages: history });

        client.to(room).emit('user:joined', { userId: client.userId, username: client.username });
    }

    @SubscribeMessage('room:leave')
    handleLeaveRoom(
        @ConnectedSocket() client: AuthSocket,
        @MessageBody() data: { room: string },
    ) {
        client.leave(data.room);
        client.to(data.room).emit('user:left', { userId: client.userId, username: client.username });
    }

    @SubscribeMessage('message:send')
    async handleMessage(
        @ConnectedSocket() client: AuthSocket,
        @MessageBody() data: { room: string; text: string; reply_to_id?: number; file_url?: string },
    ) {
        if (!client.userId) {
            client.emit('error', { message: 'Unauthorized' });
            return;
        }

        if (client.role?.includes('muted')) {
            client.emit('error', { message: 'Вам заборонено писати повідомлення' });
            return;
        }

        if (!data.text?.trim() && !data.file_url) return;

        if (!(await this.canAccessRoom(client, data.room))) {
            client.emit('error', { message: 'Forbidden' });
            return;
        }

        if (!client.rooms.has(data.room)) {
            await client.join(data.room);
        }

        const saved = await this.chatMessagesService.createMessage({
            room: data.room,
            user_id: client.userId,
            text: data.text?.trim() || '',
            reply_to_id: data.reply_to_id,
            file_url: data.file_url,
        });

        client.to(data.room).emit('message:new', saved);
        client.emit('message:new', saved);
    }

    @SubscribeMessage('chat:markRead')
    async handleMarkRead(
        @ConnectedSocket() client: AuthSocket,
        @MessageBody() data: { room: string },
    ) {
        if (!client.userId || !data?.room) return;
        if (!(await this.canAccessRoom(client, data.room))) return;
        const ids = await this.chatMessagesService.markRoomAsRead(data.room, client.userId);
        if (ids.length === 0) return;
        // Tell everyone in the room (mainly the original senders) which messages were read.
        this.server.to(data.room).emit('message:read', {
            room: data.room,
            reader_id: client.userId,
            message_ids: ids,
        });
    }

    @SubscribeMessage('message:typing')
    async handleTyping(
        @ConnectedSocket() client: AuthSocket,
        @MessageBody() data: { room: string; isTyping: boolean },
    ) {
        if (!(await this.canAccessRoom(client, data.room))) return;
        client.to(data.room).emit('user:typing', {
            userId: client.userId,
            username: client.username,
            isTyping: data.isTyping,
        });
    }

    @SubscribeMessage('message:delete')
    async handleDelete(
        @ConnectedSocket() client: AuthSocket,
        @MessageBody() data: { messageId: number; room: string },
    ) {
        if (!client.userId) return;
        const isAdmin = client.role === 'admin';
        try {
            const room = await this.chatMessagesService.findRoomByMessageId(data.messageId);
            if (!room || !(await this.canAccessRoom(client, room))) {
                client.emit('error', { message: 'Forbidden' });
                return;
            }
            await this.chatMessagesService.deleteMessage(data.messageId, client.userId, isAdmin);
            this.server.to(room).emit('message:deleted', { messageId: data.messageId });
        } catch (e) {
            client.emit('error', { message: e.message });
        }
    }

    @SubscribeMessage('message:edit')
    async handleEdit(
        @ConnectedSocket() client: AuthSocket,
        @MessageBody() data: { messageId: number; room: string; newText: string },
    ) {
        if (!client.userId) return;
        if (!data.newText?.trim()) return;
        try {
            const room = await this.chatMessagesService.findRoomByMessageId(data.messageId);
            if (!room || !(await this.canAccessRoom(client, room))) {
                client.emit('error', { message: 'Forbidden' });
                return;
            }
            const updated = await this.chatMessagesService.editMessage(data.messageId, client.userId, data.newText.trim());
            this.server.to(room).emit('message:edited', {
                messageId: data.messageId,
                newText: updated.text,
                edited_at: updated.edited_at,
            });
        } catch (e) {
            client.emit('error', { message: e.message });
        }
    }

    @SubscribeMessage('react')
    async handleReact(
        @ConnectedSocket() client: AuthSocket,
        @MessageBody() data: { room: string; messageId: number; emoji: string },
    ) {
        if (!client.userId) return;
        const room = await this.chatMessagesService.findRoomByMessageId(data.messageId);
        if (!room || !(await this.canAccessRoom(client, room))) {
            client.emit('error', { message: 'Forbidden' });
            return;
        }
        const result = await this.chatReactionsService.toggle(
            data.messageId,
            client.userId,
            client.username!,
            data.emoji,
        );
        this.server.to(room).emit('reaction:update', {
            messageId: data.messageId,
            emoji: data.emoji,
            count: result.count,
            users: result.users,
        });
    }

    @SubscribeMessage('status:update')
    async handleStatusUpdate(
        @ConnectedSocket() client: AuthSocket,
        @MessageBody() data: { status: PlatformUserStatus },
    ) {
        if (!client.userId || !data?.status) return;

        const presence = await this.usersService.updatePresence(client.userId, data.status);
        this.server.emit('status:changed', {
            user_id: presence.id,
            status: presence.status,
            timestamp: presence.last_seen_at,
        });
        client.emit('status:updated', {
            status: presence.status,
            updated_at: presence.last_seen_at,
        });
    }

    sendToUser(userId: number, event: string, data: object) {
        this.server.to(`user_${userId}`).emit(event, data);
    }

    sendToAdmins(event: string, data: object) {
        const adminUserIds = new Set<number>();
        this.server.sockets.sockets.forEach((socket) => {
            const s = socket as AuthSocket;
            if (s.role?.includes('admin') && s.userId) {
                adminUserIds.add(s.userId);
            }
        });
        adminUserIds.forEach(userId => this.server.to(`user_${userId}`).emit(event, data));
    }

    @SubscribeMessage('pin_message')
    async handlePin(
        @ConnectedSocket() client: AuthSocket,
        @MessageBody() data: { room?: string; messageId: number },
    ) {
        if (!client.userId) return;
        const room = await this.chatMessagesService.findRoomByMessageId(data.messageId) ?? data.room;
        if (!room) {
            client.emit('error', { message: 'Room not found for pin' });
            return;
        }
        if (!(await this.canAccessRoom(client, room))) {
            client.emit('error', { message: 'Forbidden' });
            return;
        }
        await this.chatPinnedService.pin(room, data.messageId, client.userId);
        const full = await this.chatPinnedService.findByRoom(room);
        const entry = full.find((p) => p.message_id === data.messageId);
        this.server.to(room).emit('message:pinned', {
            message: entry?.message ?? { id: data.messageId },
        });
    }

    @SubscribeMessage('unpin_message')
    async handleUnpin(
        @ConnectedSocket() client: AuthSocket,
        @MessageBody() data: { room?: string; messageId: number },
    ) {
        if (!client.userId) return;
        const room = await this.chatMessagesService.findRoomByMessageId(data.messageId) ?? data.room;
        if (!room) {
            client.emit('error', { message: 'Room not found for unpin' });
            return;
        }
        if (!(await this.canAccessRoom(client, room))) {
            client.emit('error', { message: 'Forbidden' });
            return;
        }
        await this.chatPinnedService.unpin(room, data.messageId);
        this.server.to(room).emit('message:unpinned', { messageId: data.messageId });
    }
}
