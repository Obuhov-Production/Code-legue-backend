import { TournamentStatus } from "../enums/TournamentStatus.enum";
import { User } from "../../users/entities/user.entity";
import { Team } from "../../teams/entities/team.entity";
import { TeamMember } from "../../team-members/entities/team-member.entity";
import { Round } from "../../rounds/entities/round.entity";
import { Announcement } from "../../announcements/entities/announcement.entity";
export declare class Tournament {
    id: number;
    name: string;
    description: string | null;
    rules: string | null;
    status: TournamentStatus;
    start_date: Date;
    end_date: Date;
    registration_start: Date;
    registration_end: Date;
    teams_limit: number | null;
    rounds_count: number;
    min_team_size: number;
    max_team_size: number;
    created_by: User;
    created_by_id: number;
    announcements: Announcement[];
    created_at: Date;
    teams: Team[];
    members: TeamMember[];
    rounds: Round[];
}
