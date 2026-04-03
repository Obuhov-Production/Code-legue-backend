import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import {Round} from "../../rounds/entities/round.entity";


@Entity('tasks')
export class Task {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    round_id: number;

    @ManyToOne(() => Round, (round) => round.tasks, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'round_id' })
    round: Round;

    @Column('text')
    title: string;

    @Column('text')
    description: string;

    @Column('text')
    tech_requirements: string;

    @Column('text')
    must_have: string;

    @Column('text', { nullable: true })
    additional_materials: string | null;

    @CreateDateColumn({ type: 'timestamp' })
    created_date: Date;
}