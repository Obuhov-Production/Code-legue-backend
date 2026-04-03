import { Team } from "../../teams/entities/team.entity";
import { SubmissionStatus } from "../enums/SubmissionStatus";
import { Round } from "../../rounds/entities/round.entity";
import { JuryAssignment } from "../../jury-assignments/entities/jury-assignment.entity";
import { Evaluation } from "../../evaluation/entities/evaluation.entity";
export declare class Submission {
    id: number;
    team_id: number;
    round_id: number;
    team: Team;
    round: Round;
    juryAssignments: JuryAssignment[];
    evaluations: Evaluation[];
    github_url: string;
    video_url: string;
    live_demo_url: string;
    description: string;
    status: SubmissionStatus;
    submitted_at: Date;
    updated_at: Date;
}
