import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
} from 'typeorm';
import {Tournament} from "../../tournaments/entities/tournament.entity";

@Entity('announcements')
export class Announcement {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    tournament_id: number;

    @ManyToOne(() => Tournament, (tournament) => tournament.announcements, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'tournament_id' })
    tournament: Tournament;

    @Column({ length: 255 })
    title: string;

    @Column('text')
    message: string;

    @CreateDateColumn({ type: 'datetime' })
    created_at: Date;
}