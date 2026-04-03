import { Round } from "../../rounds/entities/round.entity";
import { EvaluationScore } from "../../evaluation-scores/entities/evaluation-score.entity";
export declare class EvaluationCriteria {
    id: number;
    round_id: number;
    round: Round;
    name: string;
    max_score: number;
    created_at: Date;
    scores: EvaluationScore[];
}
