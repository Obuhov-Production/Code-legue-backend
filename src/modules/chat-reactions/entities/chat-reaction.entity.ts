import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    Unique,
} from 'typeorm';
import {User} from "../../users/entities/user.entity";
import {Message} from "../../chat-messages/entities/chat-message.entity";

@Entity('chat_reactions')
@Unique('unique_user_message_emoji', ['message_id', 'user_id', 'emoji'])
export class ChatReaction {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    message_id: number;

    @Column()
    user_id: number;

    @ManyToOne(() => Message, (message) => message.reactions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'message_id' })
    message: Message;

    @ManyToOne(() => User, (user) => user.chatReactions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ type: 'varchar', length: 191 })
    emoji: string;

    @Column({ type: 'varchar', length: 255 })
    username: string;
}