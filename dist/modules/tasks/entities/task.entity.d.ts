import { Round } from "../../rounds/entities/round.entity";
export declare class Task {
    id: number;
    round_id: number;
    round: Round;
    title: string;
    description: string;
    tech_requirements: string;
    must_have: string;
    additional_materials: string | null;
    created_date: Date;
}
