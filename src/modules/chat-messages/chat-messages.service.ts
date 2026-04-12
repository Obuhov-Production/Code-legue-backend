import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/chat-message.entity';

@Injectable()
export class ChatMessagesService {
    constructor(
        @InjectRepository(Message) private readonly messageRepo: Repository<Message>,
    ) {}

    async findByRoom(room: string): Promise<Message[]> {
        return this.messageRepo.find({
            where: { room },
            relations: ['user'],
            order: { created_at: 'ASC' },
        });
    }
}
