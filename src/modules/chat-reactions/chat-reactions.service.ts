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
}
