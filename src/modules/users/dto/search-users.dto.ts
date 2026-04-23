import { IsOptional, IsString, MinLength } from 'class-validator';

export class SearchUsersDto {
    @IsOptional()
    @IsString()
    @MinLength(2)
    q: string;
}