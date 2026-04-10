export declare class UpdateTournamentDto {
    name?: string;
    description?: string | null;
    rules?: string | null;
    start_date?: Date;
    end_date?: Date;
    registration_start?: Date;
    registration_end?: Date;
    teams_limit?: number | null;
    rounds_count?: number;
    min_team_size?: number;
    max_team_size?: number;
}
