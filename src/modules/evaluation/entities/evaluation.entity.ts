import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    Unique,
    CreateDateColumn, OneToMany,
} from 'typeorm';
import {Submission} from "../../submissions/entities/submission.entity";
import {User} from "../../users/entities/user.entity";
import {EvaluationScore} from "../../evaluation-scores/entities/evaluation-score.entity";

@Entity('evaluation')
@Unique('unique_jury_submission_evaluation', ['submission_id', 'jury_id'])
export class Evaluation {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    submission_id: number;

    @Column()
    jury_id: number;

    @ManyToOne(() => Submission, (submission) => submission.evaluations, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'submission_id' })
    submission: Submission;

    @ManyToOne(() => User, (user) => user.evaluations, {
        onDelete: 'CASCADE',
    })

    @OneToMany(() => EvaluationScore, (score) => score.evaluation)
    scores: EvaluationScore[];

    @JoinColumn({ name: 'jury_id' })
    jury: User;

    @Column('text', { nullable: true })
    comment: string | null;

    @Column('int')
    total_score: number;

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;
}
