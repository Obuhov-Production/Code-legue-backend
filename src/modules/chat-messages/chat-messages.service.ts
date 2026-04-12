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

    async findByRoom(room: string): Promise<Message[]> {
        return this.messageRepo.find({
            where: { room },
            relations: ['user'],
            order: { created_at: 'ASC' },
        });
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
    }): Promise<Message> {
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
        return this.messageRepo.findOne({
            where: { id: saved.id },
            relations: ['user', 'replyTo'],
        }) as Promise<Message>;
    }

    async deleteMessage(messageId: number, userId: number, isAdmin: boolean): Promise<void> {
        const msg = await this.messageRepo.findOne({ where: { id: messageId } });
        if (!msg) throw new Error('Message not found');
        if (!isAdmin && msg.user_id !== userId) throw new Error('Forbidden');
        await this.messageRepo.delete(messageId);
    }

    async editMessage(messageId: number, userId: number, newText: string): Promise<Message> {
        const msg = await this.messageRepo.findOne({ where: { id: messageId } });
        if (!msg) throw new Error('Message not found');
        if (msg.user_id !== userId) throw new Error('Forbidden');
        msg.text = newText;
        msg.edited_at = new Date();
        await this.messageRepo.save(msg);
        return this.messageRepo.findOne({ where: { id: messageId }, relations: ['user'] }) as Promise<Message>;
    }
}
