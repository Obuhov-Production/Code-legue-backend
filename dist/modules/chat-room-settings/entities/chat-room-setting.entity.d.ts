import { ChatRoom } from "../../chat-room/entities/chat-room.entity";
export declare class ChatRoomSettings {
    room: string;
    chatRoom: ChatRoom;
    locked: number;
    time_from: string | null;
    time_to: string | null;
    updated_at: Date;
}
