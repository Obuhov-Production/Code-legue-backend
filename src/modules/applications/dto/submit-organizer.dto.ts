import { IsString, IsOptional, MinLength } from 'class-validator';

export class SubmitOrganizerDto {
    @IsString()
    @MinLength(10)
    motivation: string;

    @IsString()
    @IsOptional()
    experience?: string;

    @IsString()
    @IsOptional()
    contact_email?: string;

    @IsString()
    @IsOptional()
    contact_telegram?: string;

    @IsString()
    @IsOptional()
    contact_phone?: string;
}