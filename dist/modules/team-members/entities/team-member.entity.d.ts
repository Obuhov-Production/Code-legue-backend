import { Tournament } from "../../tournaments/entities/tournament.entity";
import { Team } from "../../teams/entities/team.entity";
export declare class TeamMember {
    id: number;
    team: Team;
    tournament: Tournament;
    fullName: string;
    email: string;
    createdAt: Date;
}
