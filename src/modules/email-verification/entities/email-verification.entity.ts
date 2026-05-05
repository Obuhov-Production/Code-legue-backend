import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

/**
 * Активний код підтвердження для користувача.
 * Один user може мати лише ОДИН активний запис — при resend старий перетирається.
 */
@Entity('email_verifications')
export class EmailVerification {
    @PrimaryGeneratedColumn()
    id: number;

    @Index({ unique: true })
    @Column({ type: 'int' })
    user_id: number;

    @OneToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    /** bcrypt-хеш 6-значного коду — щоб у БД не зберігати plain code. */
    @Column({ type: 'varchar', length: 255 })
    code_hash: string;

    @Column({ type: 'datetime' })
    expires_at: Date;

    @Column({ type: 'int', default: 0 })
    attempts: number;

    /** Скільки разів юзер запитав resend — щоб поставити обмеження. */
    @Column({ type: 'int', default: 1 })
    sent_count: number;

    @Column({ type: 'datetime', nullable: true })
    last_sent_at: Date | null;

    @CreateDateColumn()
    created_at: Date;
}
