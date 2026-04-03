import { CreateChatMessageDto } from './dto/create-chat-message.dto';
import { UpdateChatMessageDto } from './dto/update-chat-message.dto';
export declare class ChatMessagesService {
    create(createChatMessageDto: CreateChatMessageDto): string;
    findAll(): string;
    findOne(id: number): string;
    update(id: number, updateChatMessageDto: UpdateChatMessageDto): string;
    remove(id: number): string;
}
