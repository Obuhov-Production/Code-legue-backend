import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    Unique,
    CreateDateColumn,
} from 'typeorm';
import {Evaluation} from "../../evaluation/entities/evaluation.entity";
import {EvaluationCriteria} from "../../evaluation-criteria/entities/evaluation-criterion.entity";

@Entity('evaluation_scores')
@Unique('unique_score_per_evaluation_criteria', ['evaluation_id', 'criteria_id'])
export class EvaluationScore {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    evaluation_id: number;

    @Column()
    criteria_id: number;

    @ManyToOne(() => Evaluation, (evaluation) => evaluation.scores, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'evaluation_id' })
    evaluation: Evaluation;

    @ManyToOne(() => EvaluationCriteria, (criteria) => criteria.scores, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'criteria_id' })
    criteria: EvaluationCriteria;

    @Column('decimal', { precision: 5, scale: 2 })
    score: number;

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;
}