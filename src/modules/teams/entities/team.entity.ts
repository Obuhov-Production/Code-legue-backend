import {Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique} from "typeorm";
import {Tournament} from "../../tournaments/entities/tournament.entity";
import {User} from "../../users/entities/user.entity";

@Entity('teams')
@Unique(['name', 'tournament_id', 'captain_id'])
export class Team {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @ManyToOne(() => Tournament, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'tournament_id' })
    tournament: Tournament;

    @Column()
    tournament_id: number;

    @ManyToOne(() => User, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'captain_id' })
    captain: User;

    @Column({ type: 'int', nullable: true })
    captain_id: number | null;

    @Column({ type: 'text', nullable: true })
    city: string | null;

    @Column({ type: 'text', nullable: true })
    school: string | null;

    @Column({ type: 'text', nullable: true })
    organisation: string | null;

    @Column({ type: 'text', nullable: true })
    telegram_username: string | null;

    @CreateDateColumn()
    created_at: Date;
}