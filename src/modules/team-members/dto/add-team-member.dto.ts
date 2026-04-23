import { IsEmail, IsInt, IsString, MaxLength, MinLength } from 'class-validator';

export class AddTeamMemberDto {
    @IsInt({ message: 'Team id must be a number' })
    team_id: number;

    @IsString()
    @MinLength(2, { message: 'Full name must be at least 2 characters' })
    @MaxLength(100, { message: 'Full name too long' })
    fullName: string;

    @IsEmail({}, { message: 'Invalid email format' })
    email: string;
}