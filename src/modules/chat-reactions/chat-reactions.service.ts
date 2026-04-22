import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatReaction } from './entities/chat-reaction.entity';

export type ReactionMap = Record<string, { emoji: string; count: number; users: number[] }>;

@Injectable()
export class ChatReactionsService {
    constructor(
        @InjectRepository(ChatReaction) private readonly reactionRepo: Repository<ChatReaction>,
    ) {}

    /** GET /chat/:room/reactions → grouped { "msgId_emoji": { emoji, count, users: userId[] } } */
    async findByRoom(room: string): Promise<ReactionMap> {
        const rows = await this.reactionRepo
            .createQueryBuilder('r')
            .innerJoin('r.message', 'm', 'm.room = :room', { room })
            .select(['r.message_id', 'r.emoji', 'r.user_id'])
            .getMany();

        const map: ReactionMap = {};
        for (const r of rows) {
            const key = `${r.message_id}_${r.emoji}`;
            if (!map[key]) {
                map[key] = { emoji: r.emoji, count: 0, users: [] };
            }
            map[key].count++;
            map[key].users.push(r.user_id);
        }
        return map;
    }

    async toggle(messageId: number, userId: number, username: string, emoji: string): Promise<{ count: number; users: number[] }> {
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
        return { count: all.length, users: all.map(r => r.user_id) };
    }
}

