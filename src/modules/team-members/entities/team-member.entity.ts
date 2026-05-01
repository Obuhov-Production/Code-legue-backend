import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    Unique,
    CreateDateColumn,
} from 'typeorm';
import {Tournament} from "../../tournaments/entities/tournament.entity";
import {Team} from "../../teams/entities/team.entity";


@Entity('team_members')
@Unique(['email', 'tournament'])
export class TeamMember {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Team)
    @JoinColumn({ name: 'team_id' })
    team: Team;

    @ManyToOne(() => Tournament)
    @JoinColumn({ name: 'tournament_id' })
    tournament: Tournament;

    @Column()
    fullName: string;

    @Column()
    email: string;

    @Column({ nullable: true, type: 'int' })
    user_id: number | null;

    @CreateDateColumn()
    createdAt: Date;
}