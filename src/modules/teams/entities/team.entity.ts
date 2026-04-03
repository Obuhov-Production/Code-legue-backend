import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    Unique
} from "typeorm";
import {Tournament} from "../../tournaments/entities/tournament.entity";
import {User} from "../../users/entities/user.entity";
import {TeamMember} from "../../team-members/entities/team-member.entity";
import {Submission} from "../../submissions/entities/submission.entity";

@Entity('teams')
@Unique(['name', 'tournament_id', 'captain_id'])
export class Team {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @ManyToOne(() => Tournament, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'tournament_id' })
    tournament: Tournament;

    @Column()
    tournament_id: number;

    @ManyToOne(() => User, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'captain_id' })
    captain: User;

    @OneToMany(() => TeamMember, (member) => member.team)
    members: TeamMember[];

    @OneToMany(() => Submission, (submission) => submission.team)
    submissions: Submission[];

    @Column({ type: 'int', nullable: true })
    captain_id: number | null;

    @Column({ type: 'text', nullable: true })
    city: string | null;

    @Column({ type: 'text', nullable: true })
    school: string | null;

    @Column({ type: 'text', nullable: true })
    organisation: string | null;

    @Column({ type: 'text', nullable: true })
    telegram_username: string | null;

    @CreateDateColumn()
    created_at: Date;
}