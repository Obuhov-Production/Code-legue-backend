import { IsEmail, IsInt, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateReviewDto {
    @IsString()
    @MaxLength(100)
    name: string;

    @IsEmail()
    email: string;

    @IsInt()
    @Min(1)
    @Max(5)
    rating: number;

    @IsString()
    @MinLength(3)
    @MaxLength(1000)
    message: string;
}
