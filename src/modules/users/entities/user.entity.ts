import {Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm";
import {UserRole} from "../enums/UserRole.enum";
import {Tournament} from "../../tournaments/entities/tournament.entity";
import {Team} from "../../teams/entities/team.entity";
import {JuryAssignment} from "../../jury-assignments/entities/jury-assignment.entity";
import {Evaluation} from "../../evaluation/entities/evaluation.entity";
import {ChatReaction} from "../../chat-reactions/entities/chat-reaction.entity";
import {ChatRoom} from "../../chat-room/entities/chat-room.entity";
import {ChatPinned} from "../../chat-pinned/entities/chat-pinned.entity";
import {Message} from "../../chat-messages/entities/chat-message.entity";

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    username: string;

    @Column({ unique: true })
    email: string;

    @Column()
    password: string;

    @Column({
        type: 'varchar',
        length: 100,
        default: 'user',
    })
    role: string;

    @Column({ type: 'text', nullable: true })
    user_description: string;

    @Column({ nullable: true })
    user_avatar_url: string;

    @Column({ nullable: true })
    banner_color: string;

    @Column({ nullable: true })
    banner_url: string;

    @Column({ default: false })
    is_chat_muted: boolean;

    @Column({ nullable: true })
    githubId?: string;

    @Column({ nullable: true })
    googleId: string;

    @Column({ nullable: true })
    discordId: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    first_name: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    last_name: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    middle_name: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    pinned_badge: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    username_updated_at: Date;

    @OneToMany(() => Tournament, (tournament) => tournament.created_by)
    tournaments: Tournament[];

    @OneToMany(() => Team, (team) => team.captain)
    captained_teams: Team[];

    @OneToMany(() => JuryAssignment, (ja) => ja.jury)
    juryAssignments: JuryAssignment[];

    @OneToMany(() => Evaluation, (evaluation) => evaluation.jury)
    evaluations: Evaluation[];

    @OneToMany(() => ChatRoom, (room) => room.creator)
    createdRooms: ChatRoom[];

    @OneToMany(() => ChatReaction, (reaction) => reaction.user)
    chatReactions: ChatReaction[];

    @OneToMany(() => ChatPinned, (pin) => pin.user)
    pinnedMessages: ChatPinned[];

    @OneToMany(() => Message, (message) => message.user)
    messages: Message[];
}