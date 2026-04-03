import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    Unique,
    UpdateDateColumn, OneToMany,
} from 'typeorm';
import {Team} from "../../teams/entities/team.entity";
import {SubmissionStatus} from "../enums/SubmissionStatus";
import {Round} from "../../rounds/entities/round.entity";
import {JuryAssignment} from "../../jury-assignments/entities/jury-assignment.entity";
import {Evaluation} from "../../evaluation/entities/evaluation.entity";




@Entity('submissions')
@Unique('unique_team_round_submission', ['team_id', 'round_id'])
export class Submission {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    team_id: number;

    @Column()
    round_id: number;

    @ManyToOne(() => Team, (team) => team.submissions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'team_id' })
    team: Team;

    @ManyToOne(() => Round, (round) => round.submissions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'round_id' })
    round: Round;

    @OneToMany(() => JuryAssignment, (ja) => ja.submission)
    juryAssignments: JuryAssignment[];

    @OneToMany(() => Evaluation, (evaluation) => evaluation.submission)
    evaluations: Evaluation[];

    @Column({ length: 500 })
    github_url: string;

    @Column({ length: 500 })
    video_url: string;

    @Column({ length: 500, nullable: true })
    live_demo_url: string;

    @Column('text', { nullable: true })
    description: string;

    @Column({
        type: 'enum',
        enum: SubmissionStatus,
        default: SubmissionStatus.DRAFT,
    })
    status: SubmissionStatus;

    @Column({ type: 'datetime', nullable: true })
    submitted_at: Date ;

    @UpdateDateColumn({ type: 'timestamp', nullable: true })
    updated_at: Date;
}