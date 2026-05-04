import { IsOptional, IsString, Matches } from 'class-validator';

const GITHUB_REPO_REGEX = /^https:\/\/github\.com\/[^/]+\/[^/]+\/?$/i;

export class UpsertTeamRepositoryDto {
    @IsString()
    @Matches(GITHUB_REPO_REGEX, { message: 'github_repo_url must be a valid GitHub repository URL' })
    github_repo_url: string;

    @IsOptional()
    @IsString()
    github_branch?: string;

    @IsOptional()
    @IsString()
    live_demo_url?: string;

    @IsOptional()
    @IsString()
    pitch_video_url?: string;

    @IsOptional()
    @IsString()
    documentation_url?: string;
}
