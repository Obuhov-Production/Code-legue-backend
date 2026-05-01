import { IsInt, IsObject, IsOptional, IsString, Min } from 'class-validator';

export class CreateEvaluationDto {
    @IsInt()
    @Min(0)
    total_score: number;

    @IsOptional()
    @IsString()
    comment?: string;

    @IsOptional()
    @IsObject()
    criteria?: Record<string, number>;
}
