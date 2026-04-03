import { Tournament } from "../../tournaments/entities/tournament.entity";
import { Submission } from "../../submissions/entities/submission.entity";
import { Task } from "../../tasks/entities/task.entity";
import { RoundStatus } from "../enums/RoundStatus";
import { EvaluationCriteria } from "../../evaluation-criteria/entities/evaluation-criterion.entity";
export declare class Round {
    id: number;
    tournament_id: number;
    tournament: Tournament;
    criteria: EvaluationCriteria[];
    title: string;
    description: string;
    status: RoundStatus;
    start_date: Date;
    end_date: Date;
    created_at: Date;
    submissions: Submission[];
    tasks: Task[];
}
