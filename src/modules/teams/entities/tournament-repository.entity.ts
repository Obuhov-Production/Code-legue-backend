import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
    UpdateDateColumn,
} from 'typeorm';
import { Tournament } from '../../tournaments/entities/tournament.entity';
import { Team } from './team.entity';

@Entity('tournament_repositories')
@Unique('unique_team_repository', ['team_id'])
export class TournamentRepository {
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

    @Column({ length: 255 })
    github_repo_url: string;

    @Column({ length: 100, default: 'main' })
    github_branch: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    github_commit_sha: string | null;

    @Column({ type: 'varchar', length: 255, nullable: true })
    live_demo_url: string | null;

    @Column({ type: 'varchar', length: 255, nullable: true })
    pitch_video_url: string | null;

    @Column({ type: 'varchar', length: 255, nullable: true })
    documentation_url: string | null;

    @Column({ type: 'boolean', default: false })
    repo_verified: boolean;

    @Column({ type: 'datetime', nullable: true })
    last_verified_at: Date | null;

    @CreateDateColumn({ type: 'datetime' })
    created_at: Date;

    @UpdateDateColumn({ type: 'datetime' })
    updated_at: Date;
}
