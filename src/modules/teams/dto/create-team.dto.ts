import {
    IsArray,
    IsInt,
    IsOptional,
    IsString,
    MaxLength,
    MinLength,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class CreateTeamMemberDto {
    @IsOptional()
    @IsString()
    fullName?: string;

    @IsOptional()
    @IsString()
    full_name?: string;

    @IsOptional()
    @IsString()
    email?: string;

    @IsOptional()
    @IsInt()
    user_id?: number;
}

export class CreateTeamDto {
    @IsString()
    @MinLength(2, { message: 'Team name must be at least 2 characters' })
    @MaxLength(50, { message: 'Team name must be less than 50 characters' })
    name: string;

    @IsInt({ message: 'Tournament id must be a number' })
    tournament_id: number;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    city?: string;

    @IsOptional()
    @IsString()
    @MaxLength(150)
    school?: string;

    @IsOptional()
    @IsString()
    @MaxLength(150)
    organisation?: string;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    telegram_username?: string;

    @IsOptional()
    @IsString()
    @MaxLength(150)
    leader_email?: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateTeamMemberDto)
    members?: CreateTeamMemberDto[];
}