import {
    IsArray,
    IsDateString,
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    Max,
    Min,
    MinLength,
} from 'class-validator';
import { TournamentStatus } from '../enums/TournamentStatus.enum';
import { TournamentCategory } from '../enums/TournamentCategory.enum';
import { TournamentFormat } from '../enums/TournamentFormat.enum';

export class CreateTournamentDto {
    @IsString()
    @MinLength(1)
    name: string;

    @IsOptional()
    @IsString()
    description?: string | null;

    @IsOptional()
    @IsString()
    rules?: string | null;

    @IsOptional()
    @IsString()
    rules_mode?: string | null;

    @IsOptional()
    @IsString()
    rules_file_url?: string | null;

    @IsOptional()
    @IsString()
    additional_prizes?: string | null;

    @IsOptional()
    @IsEnum(TournamentCategory)
    category?: TournamentCategory | null;

    @IsOptional()
    @IsEnum(TournamentFormat)
    format?: TournamentFormat | null;

    @IsOptional()
    @IsString()
    prize?: string | null;

    @IsOptional()
    @IsString()
    emoji?: string | null;

    @IsOptional()
    @IsString()
    tz?: string | null;

    @IsOptional()
    tz_enabled?: boolean;

    @IsOptional()
    @IsEnum(TournamentStatus)
    status?: TournamentStatus;

    @IsDateString()
    start_date: string;

    @IsDateString()
    end_date: string;

    @IsDateString()
    registration_start: string;

    @IsDateString()
    registration_end: string;

    @IsOptional()
    @IsDateString()
    submission_start?: string | null;

    @IsOptional()
    @IsDateString()
    submission_end?: string | null;

    @IsOptional()
    @IsInt()
    @Min(1)
    teams_limit?: number | null;

    @IsOptional()
    @IsInt()
    @Min(1)
    rounds_count?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    min_team_size?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    max_team_size?: number;

    @IsOptional()
    @IsInt()
    elo_participation?: number | null;

    @IsOptional()
    @IsInt()
    elo_per_round?: number | null;

    @IsOptional()
    @IsInt()
    elo_winner?: number | null;

    @IsOptional()
    @IsInt()
    created_by_id?: number;

    @IsOptional()
    @IsArray()
    @IsInt({ each: true })
    jury_ids?: number[];
}
