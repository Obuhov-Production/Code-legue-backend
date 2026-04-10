import { TournamentsService } from './tournaments.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from "./dto/update-tournament.dto";
import { TournamentStatus } from "./enums/TournamentStatus.enum";
export declare class TournamentsController {
    private readonly tournamentsService;
    constructor(tournamentsService: TournamentsService);
    getAll(status?: TournamentStatus): Promise<{
        creator_name: string;
        teams_count: number;
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
        created_by: import("../users/entities/user.entity").User;
        created_by_id: number;
        announcements: import("../announcements/entities/announcement.entity").Announcement[];
        created_at: Date;
        teams: import("../teams/entities/team.entity").Team[];
        members: import("../team-members/entities/team-member.entity").TeamMember[];
        rounds: import("../rounds/entities/round.entity").Round[];
    }[]>;
    getById(id: string): Promise<{
        creator_name: string;
        teams_count: number;
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
        created_by: import("../users/entities/user.entity").User;
        created_by_id: number;
        announcements: import("../announcements/entities/announcement.entity").Announcement[];
        created_at: Date;
        teams: import("../teams/entities/team.entity").Team[];
        members: import("../team-members/entities/team-member.entity").TeamMember[];
        rounds: import("../rounds/entities/round.entity").Round[];
    }>;
    create(dto: CreateTournamentDto): Promise<number>;
    update(id: string, dto: UpdateTournamentDto): Promise<{
        success: boolean;
    }>;
    delete(id: string): Promise<{
        success: boolean;
    }>;
    updateStatus(id: string, status: TournamentStatus): Promise<{
        success: boolean;
    }>;
}
