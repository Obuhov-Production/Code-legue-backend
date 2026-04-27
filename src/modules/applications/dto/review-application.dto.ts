import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApplicationStatus } from "../entities/organizer-application.entity";

export class ReviewApplicationDto {
    @IsEnum(ApplicationStatus)
    status: ApplicationStatus;

    @IsOptional()
    @IsString()
    adminComment?: string;
}