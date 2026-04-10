import { CreateTournamentDto } from './dto/create-tournament.dto';
import { Tournament } from "./entities/tournament.entity";
import { Repository } from "typeorm";
import { TournamentStatus } from "./enums/TournamentStatus.enum";
import { UpdateTournamentDto } from "./dto/update-tournament.dto";
export declare class TournamentsService {
    private readonly tournamentRepository;
    constructor(tournamentRepository: Repository<Tournament>);
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
    getById(id: number): Promise<{
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
    update(id: number, dto: UpdateTournamentDto): Promise<{
        success: boolean;
    }>;
    updateStatus(id: number, status: TournamentStatus): Promise<{
        success: boolean;
    }>;
    delete(id: number): Promise<{
        success: boolean;
    }>;
}
