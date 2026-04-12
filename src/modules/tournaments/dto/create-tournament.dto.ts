import {
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
    @IsEnum(TournamentCategory)
    category?: TournamentCategory | null;

    @IsOptional()
    @IsEnum(TournamentFormat)
    format?: TournamentFormat | null;

    @IsOptional()
    @IsString()
    prize?: string | null;

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
    created_by_id?: number;
}