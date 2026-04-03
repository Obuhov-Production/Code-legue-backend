import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn, Unique, OneToOne, OneToMany,
} from 'typeorm';
import {User} from "../../users/entities/user.entity";
import {ChatRoomSettings} from "../../chat-room-settings/entities/chat-room-setting.entity";
import {ChatPinned} from "../../chat-pinned/entities/chat-pinned.entity";
import {Message} from "../../chat-messages/entities/chat-message.entity";


@Entity('chat_rooms')
@Unique(['name'])
export class ChatRoom {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 255 })
    name: string;

    @Column({ type: 'varchar', length: 255 })
    label: string;

    @Column()
    created_by: number;

    @ManyToOne(() => User, (user) => user.createdRooms, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'created_by' })
    creator: User;

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;

    @OneToOne(() => ChatRoomSettings, (settings) => settings.chatRoom)
    settings: ChatRoomSettings;

    @OneToMany(() => ChatPinned, (pin) => pin.chatRoom)
    pinnedMessages: ChatPinned[];

    @OneToMany(() => Message, (message) => message.chatRoom)
    messages: Message[];
}