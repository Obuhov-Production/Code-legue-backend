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
}
