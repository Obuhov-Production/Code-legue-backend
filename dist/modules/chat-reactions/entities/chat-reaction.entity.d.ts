import { User } from "../../users/entities/user.entity";
import { Message } from "../../chat-messages/entities/chat-message.entity";
export declare class ChatReaction {
    id: number;
    message_id: number;
    user_id: number;
    message: Message;
    user: User;
    emoji: string;
    username: string;
}
