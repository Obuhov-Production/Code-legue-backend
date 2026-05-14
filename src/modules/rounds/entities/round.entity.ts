import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    JoinColumn,
    Unique,
    CreateDateColumn,
} from 'typeorm';
import {Tournament} from "../../tournaments/entities/tournament.entity";
import {Submission} from "../../submissions/entities/submission.entity";
import {Task} from "../../tasks/entities/task.entity";
import {RoundStatus} from "../enums/RoundStatus";
import {EvaluationCriteria} from "../../evaluation-criteria/entities/evaluation-criterion.entity";

@Entity('rounds')
@Unique('unique_round_title_per_tournament', ['tournament_id', 'title'])
export class Round {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    tournament_id: number;

    @ManyToOne(() => Tournament, (tournament) => tournament.rounds, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'tournament_id' })
    tournament: Tournament;

    @OneToMany(() => EvaluationCriteria, (criteria) => criteria.round)
    criteria: EvaluationCriteria[];

    @Column({ length: 255 })
    title: string;

    @Column('text', { nullable: true })
    description: string | null;

    @Column('text', { nullable: true })
    tech_requirements: string | null;

    @Column('simple-json', { nullable: true })
    must_have_items: string[] | null;

    @Column('simple-json', { nullable: true })
    materials: string[] | null;

    @Column({
        type: 'enum',
        enum: RoundStatus,
        default: RoundStatus.DRAFT,
    })
    status: RoundStatus;

    @Column({ type: 'datetime' })
    start_date: Date;

    @Column({ type: 'datetime' })
    end_date: Date;

    @Column({ type: 'int', default: 0 })
    sort_order: number;

    @Column({ type: 'int', nullable: true })
    max_teams_pass: number | null;

    @Column({ type: 'varchar', length: 500, nullable: true })
    rules_file_url: string | null;

    @Column({ type: 'varchar', length: 500, nullable: true })
    tz_file_url: string | null;

    @CreateDateColumn({ type: 'datetime' })
    created_at: Date;

    @OneToMany(() => Submission, (submission) => submission.round)
    submissions: Submission[];

    @OneToMany(() => Task, (task) => task.round)
    tasks: Task[];
}
