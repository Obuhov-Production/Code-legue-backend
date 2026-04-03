import { User } from "../../users/entities/user.entity";
import { Submission } from "../../submissions/entities/submission.entity";
export declare class JuryAssignment {
    id: number;
    jury_id: number;
    submission_id: number;
    jury: User;
    submission: Submission;
    comment: string;
    total_score: number;
    assigned_at: Date;
}
