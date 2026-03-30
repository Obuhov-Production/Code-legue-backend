import {Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm";
import {UserRole} from "../enums/UserRole.enum";
import {Tournament} from "../../tournaments/entities/tournament.entity";
import {Team} from "../../teams/entities/team.entity";

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
        type: 'enum',
        enum: UserRole,
        default: UserRole.USER,
    })
    role: UserRole;

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

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    username_updated_at: Date;

    @OneToMany(() => Tournament, (tournament) => tournament.created_by)
    tournaments: Tournament[];

    @OneToMany(() => Team, (team) => team.captain)
    captained_teams: Team[];
}