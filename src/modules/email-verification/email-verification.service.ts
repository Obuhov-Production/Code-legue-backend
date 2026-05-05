import {
    BadRequestException,
    Injectable,
    Logger,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { EmailVerification } from './entities/email-verification.entity';
import { User } from '../users/entities/user.entity';
import { MailService } from '../mail/mail.service';

const CODE_TTL_MIN          = 10;   // код діє 10 хвилин
const RESEND_COOLDOWN_SEC   = 45;   // мінімальний інтервал між resend
const MAX_ATTEMPTS           = 6;   // максимум спроб ввести код
const MAX_SENDS_PER_HOUR    = 6;    // лімит resend за годину
const PENDING_TOKEN_TTL_MIN = 15;   // термін дії pending JWT для verify endpoint

interface PendingPayload {
    sub: number;          // user.id
    email: string;
    typ: 'pending_verification';
}

@Injectable()
export class EmailVerificationService {
    private readonly logger = new Logger(EmailVerificationService.name);

    constructor(
        @InjectRepository(EmailVerification) private readonly repo: Repository<EmailVerification>,
        @InjectRepository(User)              private readonly userRepo: Repository<User>,
        private readonly mail:   MailService,
        private readonly jwt:    JwtService,
        private readonly config: ConfigService,
    ) {}

    /**
     * Згенерувати pending JWT, який ідентифікує юзера в /verify endpoint.
     * Окремий secret ВАЖЛИВИЙ — pending token не повинен давати доступ до API.
     */
    issuePendingToken(user: Pick<User, 'id' | 'email'>): string {
        const secret = this.config.get<string>('JWT_PENDING_SECRET')
                    || this.config.get<string>('JWT_SECRET') + ':pending';
        const payload: PendingPayload = { sub: user.id, email: user.email, typ: 'pending_verification' };
        return this.jwt.sign(payload, { secret, expiresIn: `${PENDING_TOKEN_TTL_MIN}m` });
    }

    private decodePendingToken(token: string): PendingPayload {
        const secret = this.config.get<string>('JWT_PENDING_SECRET')
                    || this.config.get<string>('JWT_SECRET') + ':pending';
        try {
            const payload = this.jwt.verify<PendingPayload>(token, { secret });
            if (payload.typ !== 'pending_verification') {
                throw new UnauthorizedException();
            }
            return payload;
        } catch {
            throw new UnauthorizedException('Pending token недійсний або прострочений');
        }
    }

    /**
     * Створити (або перезаписати) код для юзера + надіслати лист.
     * Повертає pending JWT для подальшої verify-операції.
     */
    async issueAndSendCode(user: User): Promise<{ pendingToken: string; expiresInSec: number }> {
        if (user.is_email_verified) {
            throw new BadRequestException('Email вже підтверджено');
        }

        // 6-значний код, plain → bcrypt-хеш у БД
        const code      = String(randomInt(0, 1_000_000)).padStart(6, '0');
        const codeHash  = await bcrypt.hash(code, 8);
        const expiresAt = new Date(Date.now() + CODE_TTL_MIN * 60_000);
        const now       = new Date();

        const existing = await this.repo.findOne({ where: { user_id: user.id } });

        if (existing) {
            // Anti-spam: перевіряємо ліміти
            if (existing.last_sent_at) {
                const sinceLastMs = now.getTime() - new Date(existing.last_sent_at).getTime();
                if (sinceLastMs < RESEND_COOLDOWN_SEC * 1000) {
                    const wait = Math.ceil((RESEND_COOLDOWN_SEC * 1000 - sinceLastMs) / 1000);
                    throw new BadRequestException(`Зачекайте ${wait}с перед повторним запитом коду`);
                }
            }
            // Лічимо resend за останню годину
            const oneHourAgo = new Date(now.getTime() - 3_600_000);
            if (existing.sent_count >= MAX_SENDS_PER_HOUR && new Date(existing.created_at) > oneHourAgo) {
                throw new BadRequestException('Перевищено ліміт надсилань. Спробуйте через годину.');
            }

            existing.code_hash    = codeHash;
            existing.expires_at   = expiresAt;
            existing.attempts     = 0;
            existing.sent_count   = (existing.sent_count ?? 0) + 1;
            existing.last_sent_at = now;
            await this.repo.save(existing);
        } else {
            await this.repo.save(this.repo.create({
                user_id:      user.id,
                code_hash:    codeHash,
                expires_at:   expiresAt,
                attempts:     0,
                sent_count:   1,
                last_sent_at: now,
            }));
        }

        // Не блокуємо потік — лист піде у фоні; помилка логується усередині
        this.mail.sendVerificationCode(user.email, code, CODE_TTL_MIN)
            .catch((err) => this.logger.error(`mail send failed for ${user.email}: ${err.message}`));

        return {
            pendingToken: this.issuePendingToken(user),
            expiresInSec: CODE_TTL_MIN * 60,
        };
    }

    /** Resend by pending token (юзер на сторінці /verify-email). */
    async resendByPendingToken(pendingToken: string): Promise<{ pendingToken: string; expiresInSec: number }> {
        const payload = this.decodePendingToken(pendingToken);
        const user = await this.userRepo.findOne({ where: { id: payload.sub } });
        if (!user) throw new NotFoundException('User not found');
        return this.issueAndSendCode(user);
    }

    /**
     * Перевірити введений код. Повертає підтвердженого юзера.
     */
    async verifyByPendingToken(pendingToken: string, code: string): Promise<User> {
        const payload = this.decodePendingToken(pendingToken);
        return this.verifyForUserId(payload.sub, code);
    }

    async verifyForUserId(userId: number, code: string): Promise<User> {
        const cleaned = String(code ?? '').trim();
        if (!/^\d{6}$/.test(cleaned)) {
            throw new BadRequestException('Невірний формат коду');
        }

        const record = await this.repo.findOne({ where: { user_id: userId } });
        if (!record) throw new BadRequestException('Код не знайдено — запитайте новий');

        if (new Date() > new Date(record.expires_at)) {
            throw new BadRequestException('Код прострочений — запитайте новий');
        }

        if (record.attempts >= MAX_ATTEMPTS) {
            throw new BadRequestException('Перевищено ліміт спроб — запитайте новий код');
        }

        const ok = await bcrypt.compare(cleaned, record.code_hash);
        if (!ok) {
            record.attempts += 1;
            await this.repo.save(record);
            const left = MAX_ATTEMPTS - record.attempts;
            throw new BadRequestException(
                left > 0 ? `Невірний код. Залишилось спроб: ${left}` : 'Невірний код. Запитайте новий.',
            );
        }

        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        user.is_email_verified = true;
        user.email_verified_at = new Date();
        await this.userRepo.save(user);

        // Видаляємо запис коду — більше не потрібен
        await this.repo.delete({ user_id: userId }).catch(() => {});

        return user;
    }
}
