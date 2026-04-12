import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

@Entity('organizer_applications')
export class OrganizerApplication {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE', eager: false })
    user: User;

    @Column()
    userId: number;

    @Column({ type: 'text' })
    motivation: string;

    @Column({ type: 'varchar', default: 'pending' })
    status: ApplicationStatus;

    @Column({ type: 'text', nullable: true })
    adminComment: string | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
