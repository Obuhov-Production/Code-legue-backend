import { ChatRoom } from "../../chat-room/entities/chat-room.entity";
import { User } from "../../users/entities/user.entity";
import { ChatReaction } from "../../chat-reactions/entities/chat-reaction.entity";
import { ChatPinned } from "../../chat-pinned/entities/chat-pinned.entity";
export declare class Message {
    id: number;
    room: string;
    chatRoom: ChatRoom;
    user_id: number;
    user: User;
    text: string;
    created_at: Date;
    reply_to_id: number;
    replyTo: Message;
    reactions: ChatReaction[];
    pinnedIn: ChatPinned[];
    file_url: string;
    edited_at: Date;
    deleted: number;
    msg_type: string;
}
