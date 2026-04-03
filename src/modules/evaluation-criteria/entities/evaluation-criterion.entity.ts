import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    Unique,
    CreateDateColumn,
    OneToMany,
} from 'typeorm';
import {Round} from "../../rounds/entities/round.entity";
import {EvaluationScore} from "../../evaluation-scores/entities/evaluation-score.entity";


@Entity('evaluation_criteria')
@Unique('unique_criterion_per_round', ['round_id', 'name'])
export class EvaluationCriteria {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    round_id: number;

    @ManyToOne(() => Round, (round) => round.criteria, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'round_id' })
    round: Round;

    @Column({ length: 255 })
    name: string;

    @Column('int')
    max_score: number;

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;

    @OneToMany(() => EvaluationScore, (score) => score.criteria)
    scores: EvaluationScore[];
}