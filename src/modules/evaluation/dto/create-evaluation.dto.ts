import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateEvaluationDto {
    @IsNumber()
    @Min(0)
    total_score: number;

    @IsOptional()
    @IsString()
    comment?: string;

    @IsOptional()
    criteria?: any;
}
