import { Tournament } from "../../tournaments/entities/tournament.entity";
import { User } from "../../users/entities/user.entity";
import { TeamMember } from "../../team-members/entities/team-member.entity";
import { Submission } from "../../submissions/entities/submission.entity";
export declare class Team {
    id: number;
    name: string;
    tournament: Tournament;
    tournament_id: number;
    captain: User;
    members: TeamMember[];
    submissions: Submission[];
    captain_id: number | null;
    city: string | null;
    school: string | null;
    organisation: string | null;
    telegram_username: string | null;
    created_at: Date;
}
