import { UserRole } from "../enums/UserRole.enum";
import { Tournament } from "../../tournaments/entities/tournament.entity";
import { Team } from "../../teams/entities/team.entity";
export declare class User {
    id: number;
    username: string;
    email: string;
    password: string;
    role: UserRole;
    user_description: string;
    user_avatar_url: string;
    banner_color: string;
    banner_url: string;
    is_chat_muted: boolean;
    created_at: Date;
    username_updated_at: Date;
    tournaments: Tournament[];
    captained_teams: Team[];
}
