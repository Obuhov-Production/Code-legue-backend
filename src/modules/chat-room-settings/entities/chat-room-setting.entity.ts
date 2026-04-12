import {
    Entity,
    PrimaryColumn,
    Column,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import {ChatRoom} from "../../chat-room/entities/chat-room.entity";

@Entity('chat_room_settings')
export class ChatRoomSettings {
    @PrimaryColumn('text')
    room: string;

    @ManyToOne(() => ChatRoom, (room) => room.settings, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'room', referencedColumnName: 'name' })
    chatRoom: ChatRoom;

    @Column({ type: 'int', default: 0 })
    locked: number;

    @Column({ type: 'varchar', length: 5, nullable: true })
    time_from: string | null;

    @Column({ type: 'varchar', length: 5, nullable: true })
    time_to: string | null;

    @UpdateDateColumn({ type: 'datetime' })
    updated_at: Date;
}