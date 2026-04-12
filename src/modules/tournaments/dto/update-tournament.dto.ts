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
import { TournamentCategory } from '../enums/TournamentCategory.enum';
import { TournamentFormat } from '../enums/TournamentFormat.enum';

export class UpdateTournamentDto {
    @IsOptional()
    @IsString()
    @MinLength(1)
    name?: string;

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
    @IsDateString()
    start_date?: string;

    @IsOptional()
    @IsDateString()
    end_date?: string;

    @IsOptional()
    @IsDateString()
    registration_start?: string;

    @IsOptional()
    @IsDateString()
    registration_end?: string;

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
}