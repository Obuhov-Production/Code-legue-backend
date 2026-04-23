import {
    IsInt,
    IsOptional,
    IsString,
    MaxLength,
    MinLength,
} from 'class-validator';

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
}