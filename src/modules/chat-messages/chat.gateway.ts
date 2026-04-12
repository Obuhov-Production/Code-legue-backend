import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ChatMessagesService } from './chat-messages.service';

interface AuthSocket extends Socket {
    userId?: number;
    username?: string;
    role?: string;
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

    constructor(
        private readonly chatMessagesService: ChatMessagesService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) {}

    async handleConnection(client: AuthSocket) {
        try {
            const raw =
                client.handshake.auth?.token ||
                client.handshake.headers?.authorization;

            if (!raw) {
                client.emit('error', { message: 'Unauthorized' });
                client.disconnect();
                return;
            }

            // прибираємо "Bearer " якщо є
            const token = String(raw).replace(/^Bearer\s+/i, '');

            const payload = this.jwtService.verify(token, {
                secret: this.configService.get<string>('JWT_SECRET'),
            });

            client.userId = payload.userId;
            client.username = payload.username;
            client.role = payload.role ?? 'user';
            console.log(`[WS] connected: ${client.username} (${client.id})`);
            client.emit('connected', { userId: payload.userId, username: payload.username });
        } catch (e) {
            console.error('[WS] auth error:', e?.message);
            client.emit('error', { message: 'Invalid token' });
            client.disconnect();
        }
    }

    handleDisconnect(client: AuthSocket) {
        // повідомляємо кімнати де був клієнт
        const rooms = Array.from(client.rooms).filter((r) => r !== client.id);
        rooms.forEach((room) => {
            client.to(room).emit('user:left', { userId: client.userId, username: client.username });
        });
    }

    @SubscribeMessage('room:join')
    async handleJoinRoom(
        @ConnectedSocket() client: AuthSocket,
        @MessageBody() data: { room: string },
    ) {
        const { room } = data;
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

        if (!data.text?.trim() && !data.file_url) return;

        console.log(`[WS] message:send from ${client.username} to room "${data.room}": ${data.text}`);

        // якщо клієнт не в кімнаті — автоматично приєднуємо
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

        // надсилаємо іншим у кімнаті
        client.to(data.room).emit('message:new', saved);
        // надсилаємо відправнику окремо (гарантовано)
        client.emit('message:new', saved);
    }

    @SubscribeMessage('message:typing')
    handleTyping(
        @ConnectedSocket() client: AuthSocket,
        @MessageBody() data: { room: string; isTyping: boolean },
    ) {
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
            await this.chatMessagesService.deleteMessage(data.messageId, client.userId, isAdmin);
            // броадкастимо всім у кімнаті
            this.server.to(data.room).emit('message:deleted', { messageId: data.messageId });
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
            const updated = await this.chatMessagesService.editMessage(data.messageId, client.userId, data.newText.trim());
            this.server.to(data.room).emit('message:edited', { messageId: data.messageId, newText: updated.text, edited_at: updated.edited_at });
        } catch (e) {
            client.emit('error', { message: e.message });
        }
    }
}
