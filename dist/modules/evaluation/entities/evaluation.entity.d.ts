import { Submission } from "../../submissions/entities/submission.entity";
import { User } from "../../users/entities/user.entity";
import { EvaluationScore } from "../../evaluation-scores/entities/evaluation-score.entity";
export declare class Evaluation {
    id: number;
    submission_id: number;
    jury_id: number;
    submission: Submission;
    scores: EvaluationScore[];
    jury: User;
    comment: string | null;
    total_score: number;
    created_at: Date;
}
