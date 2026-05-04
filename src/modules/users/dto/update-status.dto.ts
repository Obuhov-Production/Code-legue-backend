import { IsEnum } from 'class-validator';

export enum PlatformUserStatus {
    ONLINE = 'online',
    OFFLINE = 'offline',
    AWAY = 'away',
    DND = 'dnd',
}

export class UpdateStatusDto {
    @IsEnum(PlatformUserStatus)
    status: PlatformUserStatus;
}
