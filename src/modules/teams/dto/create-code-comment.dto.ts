import { IsInt, IsString, Min } from 'class-validator';

export class CreateCodeCommentDto {
    @IsString()
    file_path: string;

    @IsInt()
    @Min(1)
    line_number: number;

    @IsString()
    comment: string;
}
