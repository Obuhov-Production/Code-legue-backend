import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum ApplicationStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
}

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

    @Column({ type: 'varchar', default: 'pending' })
    experience: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
