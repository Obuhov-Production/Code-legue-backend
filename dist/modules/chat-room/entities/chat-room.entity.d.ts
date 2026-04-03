import { User } from "../../users/entities/user.entity";
import { ChatRoomSettings } from "../../chat-room-settings/entities/chat-room-setting.entity";
import { ChatPinned } from "../../chat-pinned/entities/chat-pinned.entity";
import { Message } from "../../chat-messages/entities/chat-message.entity";
export declare class ChatRoom {
    id: number;
    name: string;
    label: string;
    created_by: number;
    creator: User;
    created_at: Date;
    settings: ChatRoomSettings;
    pinnedMessages: ChatPinned[];
    messages: Message[];
}
