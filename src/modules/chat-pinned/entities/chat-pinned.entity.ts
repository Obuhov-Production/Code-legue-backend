import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    Unique,
    CreateDateColumn,
} from 'typeorm';
import {ChatRoom} from "../../chat-room/entities/chat-room.entity";
import {User} from "../../users/entities/user.entity";
import {Message} from "../../chat-messages/entities/chat-message.entity";

@Entity('chat_pinned')
@Unique('unique_room_message', ['room', 'message_id'])
export class ChatPinned {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('text')
    room: string;

    @ManyToOne(() => ChatRoom, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'room', referencedColumnName: 'name' })
    chatRoom: ChatRoom;

    @Column()
    message_id: number;

    @ManyToOne(() => Message, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'message_id' })
    message: Message;

    @Column()
    pinned_by: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'pinned_by' })
    user: User;

    @CreateDateColumn({ type: 'datetime' })
    pinned_at: Date;
}