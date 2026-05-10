import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/chat-message.entity';
import { ChatRoom } from '../chat-room/entities/chat-room.entity';

@Injectable()
export class ChatMessagesService {
    constructor(
        @InjectRepository(Message) private readonly messageRepo: Repository<Message>,
        @InjectRepository(ChatRoom) private readonly chatRoomRepo: Repository<ChatRoom>,
    ) {}

    async findByRoom(room: string, limit = 50, before?: number): Promise<any[]> {
        const safeLimit = Math.min(Math.max(limit, 1), 100);
        const qb = this.messageRepo.createQueryBuilder('m')
            .leftJoinAndSelect('m.user', 'user')
            .leftJoinAndSelect('m.replyTo', 'replyTo')
            .leftJoinAndSelect('replyTo.user', 'replyToUser')
            .where('m.room = :room', { room });
        if (before) qb.andWhere('m.id < :before', { before });
        qb.orderBy('m.id', 'DESC').take(safeLimit);
        const msgs = await qb.getMany();
        return msgs.reverse().map(m => this.formatMessage(m));
    }

    // Створює кімнату якщо не існує
    async ensureRoom(name: string, createdBy: number): Promise<void> {
        const existing = await this.chatRoomRepo.findOne({ where: { name } });
        if (!existing) {
            const room = this.chatRoomRepo.create({
                name,
                label: name,
                created_by: createdBy,
            });
            await this.chatRoomRepo.save(room);
        }
    }

    async createMessage(data: {
        room: string;
        user_id: number;
        text: string;
        reply_to_id?: number;
        file_url?: string;
    }): Promise<any> {
        // гарантуємо що кімната існує
        await this.ensureRoom(data.room, data.user_id);

        const message = this.messageRepo.create({
            room: data.room,
            user_id: data.user_id,
            text: data.text,
            reply_to_id: data.reply_to_id ?? undefined,
            file_url: data.file_url ?? undefined,
        });
        const saved = await this.messageRepo.save(message);
        const full = await this.messageRepo.findOne({
            where: { id: saved.id },
            relations: ['user', 'replyTo', 'replyTo.user'],
        }) as Message;
        return this.formatMessage(full);
    }

    async deleteMessage(messageId: number, userId: number, isAdmin: boolean): Promise<void> {
        const msg = await this.messageRepo.findOne({ where: { id: messageId } });
        if (!msg) throw new Error('Message not found');
        if (!isAdmin && msg.user_id !== userId) throw new Error('Forbidden');
        await this.messageRepo.delete(messageId);
    }

    async editMessage(messageId: number, userId: number, newText: string): Promise<any> {
        const msg = await this.messageRepo.findOne({ where: { id: messageId } });
        if (!msg) throw new Error('Message not found');
        if (msg.user_id !== userId) throw new Error('Forbidden');
        msg.text = newText;
        msg.edited_at = new Date();
        await this.messageRepo.save(msg);
        const full = await this.messageRepo.findOne({ where: { id: messageId }, relations: ['user'] }) as Message;
        return this.formatMessage(full);
    }

    async clearRoom(room: string) {
        await this.messageRepo.delete({ room });
        return { success: true };
    }

    /**
     * Marks every message in a room (sent by anyone other than `readerUserId`)
     * as read. Returns the list of message ids that flipped from unread → read,
     * so the gateway can notify the original senders for live ✓✓ updates.
     */
    async markRoomAsRead(room: string, readerUserId: number): Promise<number[]> {
        const unread = await this.messageRepo.find({
            where: { room, is_read: false } as any,
            select: ['id', 'user_id'],
        });
        const ids = unread.filter(m => m.user_id !== readerUserId).map(m => m.id);
        if (ids.length === 0) return [];
        await this.messageRepo
            .createQueryBuilder()
            .update(Message)
            .set({ is_read: true })
            .whereInIds(ids)
            .execute();
        return ids;
    }

    async getCustomRooms(): Promise<any[]> {
        const rooms = await this.chatRoomRepo.find({
            order: { created_at: 'ASC' },
        });
        return rooms
            .filter((r) => r.name !== 'general')
            .map((r) => ({
                id: r.id,
                name: r.name,
                label: r.label,
                created_at: r.created_at,
            }));
    }

    private formatMessage(m: Message): Record<string, any> {
        const { user, replyTo, ...rest } = m as any;
        return {
            ...rest,
            username: user?.username ?? null,
            user_avatar_url: user?.user_avatar_url ?? null,
            status: user?.status ?? 'offline',
            last_seen_at: user?.last_seen_at ?? null,
            first_name: user?.first_name ?? null,
            last_name: user?.last_name ?? null,
            pinned_badge: user?.pinned_badge ?? null,
            reply_text: replyTo?.text ?? null,
            reply_file_url: replyTo?.file_url ?? null,
            reply_username: replyTo?.user?.username ?? null,
            reply_user_id: replyTo?.user_id ?? null,
        };
    }
}
