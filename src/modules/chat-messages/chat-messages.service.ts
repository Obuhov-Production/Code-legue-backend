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

    async findByRoom(room: string): Promise<any[]> {
        const msgs = await this.messageRepo.find({
            where: { room },
            relations: ['user', 'replyTo', 'replyTo.user'],
            order: { created_at: 'ASC' },
        });
        return msgs.map(m => this.formatMessage(m));
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

    private formatMessage(m: Message): Record<string, any> {
        const { user, ...rest } = m as any;
        return {
            ...rest,
            username: user?.username ?? null,
            user_avatar_url: user?.user_avatar_url ?? null,
            first_name: user?.first_name ?? null,
            last_name: user?.last_name ?? null,
            pinned_badge: user?.pinned_badge ?? null,
        };
    }
}
