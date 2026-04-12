import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('notifications')
export class Notification {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userId: number;

    @Column({ type: 'text' })
    message: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    icon: string | null;

    @Column({ default: false })
    is_read: boolean;

    @Column({ type: 'varchar', length: 100, nullable: true })
    link_tab: string | null;

    @CreateDateColumn()
    created_at: Date;
}
