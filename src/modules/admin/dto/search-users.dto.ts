import { IsBooleanString, IsIn, IsOptional, IsString } from 'class-validator';

export class SearchUsersDto {
    @IsOptional()
    @IsString()
    q?: string;

    @IsOptional()
    @IsString()
    role?: string;

    @IsOptional()
    @IsIn(['username', 'email', 'role', 'created_at'])
    sort_by?: 'username' | 'email' | 'role' | 'created_at';

    @IsOptional()
    @IsBooleanString()
    sort_desc?: string;
}
