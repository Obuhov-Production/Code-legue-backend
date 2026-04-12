import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    Unique,
    CreateDateColumn,
} from 'typeorm';
import {User} from "../../users/entities/user.entity";
import {Submission} from "../../submissions/entities/submission.entity";

@Entity('jury_assignments')
@Unique('unique_jury_submission', ['jury_id', 'submission_id'])
export class JuryAssignment {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    jury_id: number;

    @Column()
    submission_id: number;

    @ManyToOne(() => User, (user) => user.juryAssignments, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'jury_id' })
    jury: User;

    @ManyToOne(() => Submission, (submission) => submission.juryAssignments, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'submission_id' })
    submission: Submission;

    @Column('text', { nullable: true })
    comment: string ;

    @Column('decimal', { precision: 6, scale: 2, nullable: true })
    total_score: number ;

    @CreateDateColumn({ type: 'datetime' })
    assigned_at: Date;
}