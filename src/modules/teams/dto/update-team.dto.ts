export class UpdateTeamDto {
    name?: string;

    members?: {
        fullName: string;
        email: string;
    }[];
}