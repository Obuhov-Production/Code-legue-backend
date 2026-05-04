import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Tournament } from '../../tournaments/entities/tournament.entity';
import { Team } from './team.entity';
import { User } from '../../users/entities/user.entity';

@Entity('code_reviews')
export class CodeReview {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    tournament_id: number;

    @ManyToOne(() => Tournament, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'tournament_id' })
    tournament: Tournament;

    @Column()
    team_id: number;

    @ManyToOne(() => Team, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'team_id' })
    team: Team;

    @Column()
    reviewer_id: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'reviewer_id' })
    reviewer: User;

    @Column({ length: 500 })
    file_path: string;

    @Column()
    line_number: number;

    @Column({ type: 'text' })
    comment: string;

    @CreateDateColumn({ type: 'datetime' })
    created_at: Date;
}
