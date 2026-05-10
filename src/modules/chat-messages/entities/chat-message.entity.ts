import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn, OneToMany,
} from 'typeorm';
import {ChatRoom} from "../../chat-room/entities/chat-room.entity";
import {User} from "../../users/entities/user.entity";
import {ChatReaction} from "../../chat-reactions/entities/chat-reaction.entity";
import {ChatPinned} from "../../chat-pinned/entities/chat-pinned.entity";

@Entity('messages')
export class Message {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('text')
    room: string;

    @ManyToOne(() => ChatRoom, (room) => room.messages, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'room', referencedColumnName: 'name' })
    chatRoom: ChatRoom;

    @Column()
    user_id: number;

    @ManyToOne(() => User, (user) => user.messages, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column('text')
    text: string;

    @CreateDateColumn({ type: 'datetime' })
    created_at: Date;

    @Column({ nullable: true })
    reply_to_id: number ;

    @ManyToOne(() => Message, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'reply_to_id' })
    replyTo: Message ;

    @OneToMany(() => ChatReaction, (reaction) => reaction.message)
    reactions: ChatReaction[];

    @OneToMany(() => ChatPinned, (pin) => pin.message)
    pinnedIn: ChatPinned[];

    @Column({ length: 500, nullable: true })
    file_url: string ;

    @Column({ type: 'datetime', nullable: true })
    edited_at: Date ;

    @Column({ default: 0 })
    deleted: number;

    @Column({ length: 20, default: 'user' })
    msg_type: string;

    @Column({ default: false })
    is_read: boolean;
}