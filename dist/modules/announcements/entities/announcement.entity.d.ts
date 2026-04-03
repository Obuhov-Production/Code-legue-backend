import { Tournament } from "../../tournaments/entities/tournament.entity";
export declare class Announcement {
    id: number;
    tournament_id: number;
    tournament: Tournament;
    title: string;
    message: string;
    created_at: Date;
}
