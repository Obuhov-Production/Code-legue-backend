import { Evaluation } from "../../evaluation/entities/evaluation.entity";
import { EvaluationCriteria } from "../../evaluation-criteria/entities/evaluation-criterion.entity";
export declare class EvaluationScore {
    id: number;
    evaluation_id: number;
    criteria_id: number;
    evaluation: Evaluation;
    criteria: EvaluationCriteria;
    score: number;
    created_at: Date;
}
