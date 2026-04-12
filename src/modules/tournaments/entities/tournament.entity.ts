import {
    Check,
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn
} from "typeorm";
import {TournamentStatus} from "../enums/TournamentStatus.enum";
import {User} from "../../users/entities/user.entity";
import {Team} from "../../teams/entities/team.entity";
import {TeamMember} from "../../team-members/entities/team-member.entity";
import {Round} from "../../rounds/entities/round.entity";
import {Announcement} from "../../announcements/entities/announcement.entity";

@Entity('tournaments')
@Check(`"rounds_count" >= 1`)
@Check(`"min_team_size" >= 2`)
@Check(`"max_team_size" >= "min_team_size"`)
@Check(`"end_date" > "start_date"`)
@Check(`"registration_end" >= "registration_start"`)
export class Tournament {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string | null;

    @Column({ type: 'text', nullable: true })
    rules: string | null;

    @Column({
        type: 'simple-enum',
        enum: TournamentStatus,
        default: TournamentStatus.DRAFT,
    })
    status: TournamentStatus;

    @Column({ type: 'datetime' })
    start_date: Date;

    @Column({ type: 'datetime' })
    end_date: Date;

    @Column({ type: 'datetime' })
    registration_start: Date;

    @Column({ type: 'datetime' })
    registration_end: Date;

    @Column({ type: 'int', nullable: true })
    teams_limit: number | null;

    @Column({ type: 'int' })
    rounds_count: number;

    @Column({ type: 'int' })
    min_team_size: number;

    @Column({ type: 'int' })
    max_team_size: number;

    @ManyToOne(() => User, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'created_by' })
    created_by: User;

    @Column({ type: 'int', nullable: true })
    created_by_id: number ;

    @OneToMany(() => Announcement, (announcement) => announcement.tournament)
    announcements: Announcement[];

    @CreateDateColumn()
    created_at: Date;

    @OneToMany(() => Team, (team) => team.tournament)
    teams: Team[];

    @OneToMany(() => TeamMember, (member) => member.tournament)
    members: TeamMember[];

    @OneToMany(() => Round, (round) => round.tournament)
    rounds: Round[];
}