import { IsArray, IsDateString, IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { RoundStatus } from '../enums/RoundStatus';

export class CreateRoundDto {
    @IsString()
    @MaxLength(255)
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    tech_requirements?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    must_have_items?: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    materials?: string[];

    @IsDateString()
    starts_at: string;

    @IsDateString()
    deadline_at: string;

    @IsOptional()
    @IsEnum(RoundStatus)
    status?: RoundStatus;

    @IsOptional()
    @IsInt()
    @Min(0)
    sort_order?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    max_teams_pass?: number;

    @IsOptional()
    @IsString()
    rules_file_url?: string;

    @IsOptional()
    @IsString()
    tz_file_url?: string;
}
