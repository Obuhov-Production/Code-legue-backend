import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatPinned } from './entities/chat-pinned.entity';

@Injectable()
export class ChatPinnedService {
    constructor(
        @InjectRepository(ChatPinned) private readonly pinnedRepo: Repository<ChatPinned>,
    ) {}

    async findByRoom(room: string): Promise<ChatPinned[]> {
        return this.pinnedRepo.find({
            where: { room },
            relations: ['message', 'user'],
            order: { pinned_at: 'DESC' },
        });
    }

    async pin(room: string, messageId: number, pinnedBy: number): Promise<ChatPinned> {
        if (!room || typeof room !== 'string') {
            // Додаємо лог для дебагу
            console.error('[ChatPinnedService] pin: room is missing or not a string', { room, messageId, pinnedBy });
            throw new Error('Room must be a non-empty string');
        }
        const existing = await this.pinnedRepo.findOne({ where: { room, message_id: messageId } });
        if (existing) return existing;

        const entry = this.pinnedRepo.create({ room, message_id: messageId, pinned_by: pinnedBy });
        return this.pinnedRepo.save(entry);
    }

    async unpin(room: string, messageId: number): Promise<void> {
        await this.pinnedRepo.delete({ room, message_id: messageId });
    }
}
