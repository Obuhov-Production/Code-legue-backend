import { ChatRoom } from "../../chat-room/entities/chat-room.entity";
import { User } from "../../users/entities/user.entity";
import { Message } from "../../chat-messages/entities/chat-message.entity";
export declare class ChatPinned {
    id: number;
    room: string;
    chatRoom: ChatRoom;
    message_id: number;
    message: Message;
    pinned_by: number;
    user: User;
    pinned_at: Date;
}
