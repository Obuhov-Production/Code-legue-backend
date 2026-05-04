import { ArrayNotEmpty, IsArray, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export enum BulkUserAction {
    BAN = 'ban',
    UNBAN = 'unban',
    DELETE = 'delete',
    CHANGE_ROLE = 'change_role',
}

export class BulkUserActionDto {
    @IsArray()
    @ArrayNotEmpty()
    @Type(() => Number)
    @IsInt({ each: true })
    user_ids: number[];

    @IsEnum(BulkUserAction)
    action: BulkUserAction;

    @IsOptional()
    @IsString()
    role?: string;
}
