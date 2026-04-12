import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatReaction } from './entities/chat-reaction.entity';

@Injectable()
export class ChatReactionsService {
    constructor(
        @InjectRepository(ChatReaction) private readonly reactionRepo: Repository<ChatReaction>,
    ) {}

    async findByRoom(room: string): Promise<ChatReaction[]> {
        return this.reactionRepo
            .createQueryBuilder('r')
            .innerJoin('r.message', 'm', 'm.room = :room', { room })
            .getMany();
    }

    async toggle(messageId: number, userId: number, username: string, emoji: string): Promise<{ count: number; users: string[] }> {
        const existing = await this.reactionRepo.findOne({
            where: { message_id: messageId, user_id: userId, emoji },
        });

        if (existing) {
            await this.reactionRepo.remove(existing);
        } else {
            await this.reactionRepo.save(
                this.reactionRepo.create({ message_id: messageId, user_id: userId, username, emoji }),
            );
        }

        const all = await this.reactionRepo.find({ where: { message_id: messageId, emoji } });
        return { count: all.length, users: all.map(r => r.username) };
    }
}

