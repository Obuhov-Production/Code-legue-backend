import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { DeepPartial, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '../users/enums/UserRole.enum';
import { PlatformUserStatus } from '../users/dto/update-status.dto';
import { EmailVerificationService } from '../email-verification/email-verification.service';
import { MailService } from '../mail/mail.service';
import { randomInt } from 'crypto';

const FP_CODE_TTL_MIN = 10;
const FP_RESEND_COOLDOWN_SEC = 45;
const FP_MAX_ATTEMPTS = 6;

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User) private authRepository: Repository<User>,
        private jwtService: JwtService,
        private configService: ConfigService,
        private emailVerification: EmailVerificationService,
        private mail: MailService,
    ) {}

    /* ── Forgot password (no auth) ───────────────────────────────────── */

    /**
     * Не розкриваємо чи існує email — повертаємо ту ж відповідь незалежно від результату.
     * Перевикористовуємо колонки password_change_* з User entity.
     */
    async forgotPasswordRequest(email: string) {
        const generic = { ok: true, expiresInSec: FP_CODE_TTL_MIN * 60 };
        if (!email || typeof email !== 'string') return generic;

        const user = await this.authRepository.findOne({ where: { email } });
        if (!user) return generic;

        if (user.password_change_last_sent_at) {
            const since = Date.now() - new Date(user.password_change_last_sent_at).getTime();
            if (since < FP_RESEND_COOLDOWN_SEC * 1000) {
                const wait = Math.ceil((FP_RESEND_COOLDOWN_SEC * 1000 - since) / 1000);
                throw new BadRequestException(`Зачекайте ${wait}с перед повторним запитом коду`);
            }
        }

        const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
        const codeHash = await bcrypt.hash(code, 8);
        const now = new Date();
        user.password_change_code_hash = codeHash;
        user.password_change_expires_at = new Date(now.getTime() + FP_CODE_TTL_MIN * 60_000);
        user.password_change_attempts = 0;
        user.password_change_last_sent_at = now;
        await this.authRepository.save(user);

        const subject = `Code League — код для відновлення пароля ${code}`;
        const html = `
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#fafafa;border-radius:12px">
              <h2 style="color:#1f2937;margin:0 0 12px">Відновлення пароля</h2>
              <p style="color:#374151;font-size:14px;line-height:1.5">
                Ви запросили відновлення пароля для акаунту <b>${user.email}</b>.
                Введіть цей код у вікні підтвердження. Код діє ${FP_CODE_TTL_MIN} хв.
              </p>
              <div style="font-size:36px;letter-spacing:10px;font-weight:700;color:#7c5ff5;text-align:center;
                          padding:18px;background:#fff;border:1px dashed #ddd;border-radius:10px;margin:18px 0">${code}</div>
              <p style="color:#6b7280;font-size:12px;line-height:1.5">
                Якщо це не ви — проігноруйте лист.
              </p>
            </div>`;
        const text = `Code League — код відновлення пароля: ${code}\nКод діє ${FP_CODE_TTL_MIN} хв.`;
        this.mail.send({ to: user.email, subject, html, text }).catch(() => {});

        return generic;
    }

    /** Перевірити код без зміни пароля (UI: розблокувати поле нового пароля). */
    async forgotPasswordVerifyCode(email: string, code: string) {
        if (!/^\d{6}$/.test(String(code ?? '').trim())) {
            throw new BadRequestException('Невірний формат коду');
        }
        const user = await this.authRepository
            .createQueryBuilder('user')
            .addSelect(['user.password_change_code_hash'])
            .where('user.email = :email', { email })
            .getOne();
        if (!user || !user.password_change_code_hash || !user.password_change_expires_at) {
            throw new BadRequestException('Код не запитано або вже не дійсний');
        }
        if (new Date() > new Date(user.password_change_expires_at)) {
            throw new BadRequestException('Код прострочений — запитайте новий');
        }
        if ((user.password_change_attempts ?? 0) >= FP_MAX_ATTEMPTS) {
            throw new BadRequestException('Перевищено ліміт спроб — запитайте новий код');
        }
        const ok = await bcrypt.compare(String(code).trim(), user.password_change_code_hash);
        if (!ok) {
            user.password_change_attempts = (user.password_change_attempts ?? 0) + 1;
            await this.authRepository.save(user);
            const left = FP_MAX_ATTEMPTS - user.password_change_attempts;
            throw new BadRequestException(left > 0 ? `Невірний код. Залишилось спроб: ${left}` : 'Невірний код. Запитайте новий.');
        }
        return { ok: true };
    }

    async forgotPasswordReset(email: string, code: string, newPassword: string) {
        if (typeof newPassword !== 'string' || newPassword.length < 8) {
            throw new BadRequestException('Новий пароль має бути не коротшим за 8 символів');
        }
        // Валідуємо код ще раз — це фінальна точка зміни
        await this.forgotPasswordVerifyCode(email, code);

        const user = await this.authRepository.findOne({ where: { email } });
        if (!user) throw new BadRequestException('Невірний код або email');

        user.password = await bcrypt.hash(newPassword, 10);
        user.password_change_code_hash = null;
        user.password_change_expires_at = null;
        user.password_change_attempts = 0;
        user.password_changed_at = new Date();
        await this.authRepository.save(user);

        return { ok: true };
    }

    private signTokens(payload: { userId: number; username: string; email: string; role: string }) {
        const accessToken = this.jwtService.sign(payload, {
            secret: this.configService.get<string>('JWT_SECRET'),
            expiresIn: '2h',
        });
        const refreshToken = this.jwtService.sign(payload, {
            secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            expiresIn: '7d',
        });
        return { token: accessToken, accessToken, refreshToken };
    }

    async create(dto: CreateUserDto) {
        const existingUser = await this.authRepository.findOne({
            where: { email: dto.email },
        });

        if (existingUser) {
            throw new BadRequestException('Email already exists');
        }

        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const now = new Date();

        const user = this.authRepository.create({
            email: dto.email,
            username: dto.username,
            password: hashedPassword,
            role: UserRole.USER,
            status: PlatformUserStatus.OFFLINE,
            last_seen_at: now,
            status_updated_at: now,
            github_connected: false,
            auth_provider: 'email',
            is_email_verified: false,
            email_verified_at: null,
        });

        const savedUser = await this.authRepository.save(user);

        // Email verification: код + лист, повертаємо pendingToken (НЕ повертаємо JWT)
        const { pendingToken, expiresInSec } = await this.emailVerification.issueAndSendCode(savedUser);
        const { password, ...userData } = savedUser;

        return {
            requiresVerification: true,
            pendingToken,
            expiresInSec,
            email: savedUser.email,
            user: userData,
        };
    }

    async login(dto: LoginUserDto) {
        const user = await this.authRepository.findOne({
            where: { email: dto.email },
            select: ['id', 'username', 'email', 'password', 'role', 'is_email_verified'],
        });

        if (!user) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const isPasswordValid = await bcrypt.compare(dto.password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid email or password');
        }

        // Якщо існуючий акаунт не підтверджений — вимагаємо код
        if (!user.is_email_verified) {
            const { pendingToken, expiresInSec } = await this.emailVerification.issueAndSendCode(user);
            return {
                requiresVerification: true,
                pendingToken,
                expiresInSec,
                email: user.email,
            };
        }

        const payload = { userId: user.id, username: user.username, email: user.email, role: user.role };
        const tokens = this.signTokens(payload);
        const { password, ...userData } = user;
        return { user: userData, ...tokens };
    }

    /**
     * Викликається після успішного підтвердження коду.
     * Повертає реальні JWT-токени.
     */
    issueTokensForVerifiedUser(user: User) {
        const payload = { userId: user.id, username: user.username, email: user.email, role: user.role };
        const tokens = this.signTokens(payload);
        const { password, ...userData } = user;
        return { user: userData, ...tokens };
    }

    async oauthLogin(profile: {
        email?: string;
        username: string;
        googleId?: string;
        discordId?: string;
        avatarUrl?: string;
        githubId?: string;
        githubUsername?: string | null;
        githubToken?: string | null;
    }): Promise<
        | { token: string; accessToken: string; refreshToken: string; user: Omit<User, 'password'>; requiresVerification?: false }
        | { requiresVerification: true; pendingToken: string; expiresInSec: number; email: string }
    > {
        const {
            email,
            username,
            googleId,
            discordId,
            avatarUrl,
            githubId,
            githubUsername,
            githubToken,
        } = profile;

        let user: User | null = null;

        if (googleId) {
            user = await this.authRepository.findOne({ where: { googleId } });
        }
        if (!user && discordId) {
            user = await this.authRepository.findOne({ where: { discordId } });
        }
        if (!user && githubId) {
            user = await this.authRepository.findOne({ where: { githubId } });
        }
        if (!user && email) {
            user = await this.authRepository.findOne({ where: { email } });
        }

        if (user) {
            let changed = false;
            if (googleId && !user.googleId) { user.googleId = googleId; changed = true; }
            if (discordId && !user.discordId) { user.discordId = discordId; changed = true; }
            if (githubId && !user.githubId) { user.githubId = githubId; changed = true; }
            if (githubUsername) { user.github_username = githubUsername; changed = true; }
            if (githubToken) { user.github_token = githubToken; changed = true; }
            if (githubId) { user.github_connected = true; user.auth_provider = 'github'; changed = true; }
            if (googleId) { user.auth_provider = 'google'; changed = true; }
            if (avatarUrl) { user.user_avatar_url = avatarUrl; changed = true; }
            if (changed) {
                await this.authRepository.save(user);
            }
        } else {
            if (!email) {
                throw new BadRequestException('OAuth provider did not return email');
            }

            const randomPassword = await bcrypt.hash(Math.random().toString(36) + Date.now().toString(), 12);
            const uniqueUsername = await this.buildUniqueUsername(username);
            const now = new Date();
            const partial: DeepPartial<User> = {
                email,
                username: uniqueUsername,
                password: randomPassword,
                role: UserRole.USER,
                status: PlatformUserStatus.OFFLINE,
                last_seen_at: now,
                status_updated_at: now,
                github_username: githubUsername ?? null,
                github_token: githubToken ?? null,
                github_connected: !!githubId,
                auth_provider: githubId ? 'github' : googleId ? 'google' : 'email',
                googleId: googleId ?? undefined,
                discordId: discordId ?? undefined,
                githubId: githubId ?? undefined,
                user_avatar_url: avatarUrl ?? undefined,
                // Новостворений OAuth-юзер: пошта ще НЕ підтверджена
                is_email_verified: false,
                email_verified_at: null,
            };
            user = await this.authRepository.save(this.authRepository.create(partial));
        }

        // Якщо акаунт не підтверджений (новий або раніше залишений недопідтвердженим) —
        // надсилаємо код і повертаємо pending. Інакше — звичайні токени.
        if (!user.is_email_verified) {
            const { pendingToken, expiresInSec } = await this.emailVerification.issueAndSendCode(user);
            return {
                requiresVerification: true,
                pendingToken,
                expiresInSec,
                email: user.email,
            };
        }

        const payload = { userId: user.id, username: user.username, email: user.email, role: user.role };
        const tokens = this.signTokens(payload);
        const { password, ...userData } = user;
        return { ...tokens, user: userData };
    }

    async getMe(userId: number) {
        const user = await this.authRepository.findOne({ where: { id: userId } });
        if (!user) throw new UnauthorizedException('Session expired, please sign in again');
        const { password, ...userData } = user;
        return userData;
    }

    async updateMe(userId: number, dto: {
        first_name?: string;
        last_name?: string;
        middle_name?: string;
        pinned_badge?: string;
        user_description?: string;
        banner_color?: string;
        banner_url?: string;
        user_avatar_url?: string;
    }) {
        const user = await this.authRepository.findOne({ where: { id: userId } });
        if (!user) throw new UnauthorizedException('Session expired, please sign in again');
        Object.assign(user, dto);
        const saved = await this.authRepository.save(user);
        const { password, ...userData } = saved;
        return userData;
    }

    private async buildUniqueUsername(base: string): Promise<string> {
        const clean = base.replace(/\s+/g, '_').toLowerCase().slice(0, 30);
        let name = clean;
        let count = 1;
        while (await this.authRepository.findOne({ where: { username: name } })) {
            name = `${clean}_${count++}`;
        }
        return name;
    }

    async refresh(refreshToken: string) {
        try {
            const payload = await this.jwtService.verifyAsync(refreshToken);
            const newAccessToken = this.jwtService.sign(
                { userId: payload.userId, username: payload.username, email: payload.email, role: payload.role },
                { expiresIn: '2h' },
            );
            return { accessToken: newAccessToken };
        } catch {
            throw new UnauthorizedException('Invalid or expired token');
        }
    }

    verifyAccessToken(token: string) {
        return this.jwtService.verify(token);
    }

    async touchUserActivity(userId: number) {
        await this.authRepository.update(
            { id: userId },
            { last_seen_at: new Date() },
        );
    }
}
