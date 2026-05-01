import { IsArray, IsEmail, IsInt, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateTeamMemberDto {
    @IsOptional()
    @IsString()
    fullName?: string;

    @IsOptional()
    @IsString()
    full_name?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsInt()
    user_id?: number;
}

export class UpdateTeamDto {
    @IsOptional()
    @IsString()
    @MaxLength(50)
    name?: string;

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
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateTeamMemberDto)
    members?: UpdateTeamMemberDto[];
}
