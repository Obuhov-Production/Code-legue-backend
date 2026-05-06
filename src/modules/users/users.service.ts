import { BadRequestException, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PlatformUserStatus } from './dto/update-status.dto';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { Badge } from '../badges/entities/badge.entity';
import { MailService } from '../mail/mail.service';

const PWD_CODE_TTL_MIN = 10;
const PWD_RESEND_COOLDOWN_SEC = 45;
const PWD_MAX_ATTEMPTS = 6;

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);

    constructor(
        @InjectRepository(User) private userRepository: Repository<User>,
        @InjectRepository(Badge) private badgeRepository: Repository<Badge>,
        private readonly mail: MailService,
    ) {}

    async requestPasswordChange(userId: number) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');
        if (!user.email) throw new BadRequestException('Account has no email on file');

        if (user.password_change_last_sent_at) {
            const since = Date.now() - new Date(user.password_change_last_sent_at).getTime();
            if (since < PWD_RESEND_COOLDOWN_SEC * 1000) {
                const wait = Math.ceil((PWD_RESEND_COOLDOWN_SEC * 1000 - since) / 1000);
                throw new BadRequestException(`Зачекайте ${wait}с перед повторним запитом коду`);
            }
        }

        const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
        const codeHash = await bcrypt.hash(code, 8);
        const now = new Date();
        user.password_change_code_hash = codeHash;
        user.password_change_expires_at = new Date(now.getTime() + PWD_CODE_TTL_MIN * 60_000);
        user.password_change_attempts = 0;
        user.password_change_last_sent_at = now;
        await this.userRepository.save(user);

        const subject = `Code League — код для зміни пароля ${code}`;
        const html = `
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#fafafa;border-radius:12px">
              <h2 style="color:#1f2937;margin:0 0 12px">Зміна пароля</h2>
              <p style="color:#374151;font-size:14px;line-height:1.5">
                Ви запросили зміну пароля для свого акаунту <b>${user.email}</b>.
                Введіть цей код у вікні підтвердження. Код діє ${PWD_CODE_TTL_MIN} хв.
              </p>
              <div style="font-size:36px;letter-spacing:10px;font-weight:700;color:#7c5ff5;text-align:center;
                          padding:18px;background:#fff;border:1px dashed #ddd;border-radius:10px;margin:18px 0">${code}</div>
              <p style="color:#6b7280;font-size:12px;line-height:1.5">
                Якщо це були не ви — проігноруйте цей лист, і пароль залишиться без змін.
              </p>
            </div>`;
        const text = `Code League — код для зміни пароля: ${code}\nКод діє ${PWD_CODE_TTL_MIN} хв.\nЯкщо це не ви — проігноруйте лист.`;
        this.mail.send({ to: user.email, subject, html, text })
            .catch((err) => this.logger.error(`pwd-change mail failed for ${user.email}: ${err.message}`));

        return { expiresInSec: PWD_CODE_TTL_MIN * 60, email: this.maskEmail(user.email) };
    }

    async confirmPasswordChange(userId: number, code: string, newPassword: string, currentPassword?: string) {
        if (!/^\d{6}$/.test(code)) throw new BadRequestException('Невірний формат коду');
        if (typeof newPassword !== 'string' || newPassword.length < 8) {
            throw new BadRequestException('Новий пароль має бути не коротшим за 8 символів');
        }

        const user = await this.userRepository
            .createQueryBuilder('user')
            .addSelect(['user.password', 'user.password_change_code_hash'])
            .where('user.id = :id', { id: userId })
            .getOne();
        if (!user) throw new NotFoundException('User not found');

        if (!user.password_change_code_hash || !user.password_change_expires_at) {
            throw new BadRequestException('Код не запитано — спочатку натисніть «Надіслати код»');
        }
        if (new Date() > new Date(user.password_change_expires_at)) {
            throw new BadRequestException('Код прострочений — запитайте новий');
        }
        if ((user.password_change_attempts ?? 0) >= PWD_MAX_ATTEMPTS) {
            throw new BadRequestException('Перевищено ліміт спроб — запитайте новий код');
        }

        const codeOk = await bcrypt.compare(code, user.password_change_code_hash);
        if (!codeOk) {
            user.password_change_attempts = (user.password_change_attempts ?? 0) + 1;
            await this.userRepository.save(user);
            const left = PWD_MAX_ATTEMPTS - user.password_change_attempts;
            throw new BadRequestException(left > 0 ? `Невірний код. Залишилось спроб: ${left}` : 'Невірний код. Запитайте новий.');
        }

        if (currentPassword && user.password) {
            const ok = await bcrypt.compare(currentPassword, user.password);
            if (!ok) throw new UnauthorizedException('Поточний пароль невірний');
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.password_change_code_hash = null;
        user.password_change_expires_at = null;
        user.password_change_attempts = 0;
        user.password_changed_at = new Date();
        await this.userRepository.save(user);

        return { message: 'Пароль успішно змінено', changed_at: user.password_changed_at };
    }

    async getUserById(id: number): Promise<any> {
        const user = await this.userRepository.findOne({
            where: { id },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return this.toSelfProfile(user);
    }

    async getUserByEmail(email: string): Promise<any> {
        const user = await this.userRepository.findOne({
            where: { email },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return this.toSelfProfile(user);
    }

    async getAllUsers(): Promise<User[]> {
        return this.userRepository.find();
    }

    async getUsersByRole(role: string) {
        return this.userRepository
            .createQueryBuilder('user')
            .select([
                'user.id',
                'user.username',
                'user.email',
                'user.role',
                'user.elo',
                'user.user_avatar_url',
                'user.status',
            ])
            .where('LOWER(user.role) LIKE :role', { role: `%${role.toLowerCase()}%` })
            .orderBy('user.username', 'ASC')
            .getMany();
    }

    async updateMe(userId: number, dto: {
        username?: string;
        first_name?: string;
        last_name?: string;
        middle_name?: string;
        pinned_badge?: string;
        user_description?: string;
        banner_color?: string;
        banner_url?: string;
        user_avatar_url?: string;
    }): Promise<Record<string, any>> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');
        const usernameChanged = dto.username && dto.username !== user.username;
        Object.assign(user, dto);
        if (usernameChanged) {
            user.username_updated_at = new Date();
        }
        const saved = await this.userRepository.save(user);

        if (saved.first_name && saved.last_name && saved.middle_name) {
            const existing = await this.badgeRepository.findOne({
                where: { userId, name: 'identity_confirmed' },
            });
            if (!existing) {
                await this.badgeRepository.save(
                    this.badgeRepository.create({
                        userId,
                        name: 'identity_confirmed',
                        description: 'ПІБ підтверджено',
                    }),
                );
            }
        }

        return this.toSelfProfile(saved);
    }

    async getUserStatus(id: number) {
        const user = await this.userRepository.findOne({
            where: { id },
            select: ['id', 'status', 'last_seen_at'],
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return {
            user_id: user.id,
            status: user.status,
            last_seen_at: user.last_seen_at,
            last_seen_text: this.formatLastSeenText(user.last_seen_at),
        };
    }

    async updateMyStatus(userId: number, status: PlatformUserStatus) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        const now = new Date();
        user.status = status;
        user.last_seen_at = now;
        user.status_updated_at = now;
        await this.userRepository.save(user);

        return {
            status: user.status,
            updated_at: user.status_updated_at,
        };
    }

    async getOnlineUsers() {
        const users = await this.userRepository.find({
            where: { status: PlatformUserStatus.ONLINE },
            select: ['id', 'username', 'status', 'last_seen_at', 'user_avatar_url'],
            order: { username: 'ASC' },
        });

        return {
            online_count: users.length,
            users: users.map((user) => ({
                id: user.id,
                username: user.username,
                status: user.status,
                last_seen_at: user.last_seen_at,
                avatar_url: user.user_avatar_url ?? null,
            })),
        };
    }

    async searchUsers(q: string) {
        if (!q || q.trim().length < 2) {
            return [];
        }

        const query = q.trim();

        const users = await this.userRepository
            .createQueryBuilder('user')
            .select([
                'user.id',
                'user.username',
                'user.email',
                'user.role',
                'user.first_name',
                'user.last_name',
                'user.middle_name',
                'user.user_description',
                'user.user_avatar_url',
                'user.banner_color',
                'user.banner_url',
                'user.created_at',
                'user.status',
                'user.last_seen_at',
                'user.elo',
            ])
            .where('user.username LIKE :query', { query: `%${query}%` })
            .andWhere('user.role != :banned', { banned: 'banned' })
            .limit(20)
            .getMany();

        return users.map((user) => ({
            id: user.id,
            username: user.username,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
            user_description: user.user_description,
            user_avatar_url: user.user_avatar_url,
            banner_color: user.banner_color,
            banner_url: user.banner_url,
            created_at: user.created_at,
            status: user.status,
            last_seen_at: user.last_seen_at,
            elo: user.elo,
            identity_confirmed: !!(user.first_name && user.last_name && user.middle_name),
        }));
    }

    async getPublicProfileByUsername(username: string) {
        const user = await this.userRepository.findOne({ where: { username } });
        if (!user) throw new NotFoundException('User not found');
        return this.getPublicProfile(user.id);
    }

    async getPublicProfile(id: number) {
        const user = await this.userRepository
            .createQueryBuilder('user')
            .select([
                'user.id',
                'user.username',
                'user.role',
                'user.user_description',
                'user.user_avatar_url',
                'user.banner_color',
                'user.banner_url',
                'user.first_name',
                'user.last_name',
                'user.middle_name',
                'user.pinned_badge',
                'user.created_at',
                'user.status',
                'user.last_seen_at',
                'user.elo',
            ])
            .where('user.id = :id', { id })
            .getOne();

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return {
            ...user,
            last_seen_text: this.formatLastSeenText(user.last_seen_at),
        };
    }

    async deleteAccount(userId: number) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        const manager = this.userRepository.manager;
        await manager.transaction(async (tx) => {
            await tx.query('DELETE FROM badges WHERE userId = ?', [userId]).catch(() => {});
            await tx.query('DELETE FROM chat_reactions WHERE userId = ?', [userId]).catch(() => {});
            await tx.query('DELETE FROM chat_pinned WHERE userId = ?', [userId]).catch(() => {});
            await tx.query('DELETE FROM chat_messages WHERE userId = ?', [userId]).catch(() => {});
            await tx.query('DELETE FROM messages WHERE userId = ?', [userId]).catch(() => {});
            await tx.query('DELETE FROM notifications WHERE userId = ?', [userId]).catch(() => {});
            await tx.query('DELETE FROM jury_assignments WHERE juryId = ?', [userId]).catch(() => {});
            await tx.query('DELETE FROM evaluations WHERE juryId = ?', [userId]).catch(() => {});
            await tx.query('DELETE FROM organizer_applications WHERE userId = ?', [userId]).catch(() => {});
            await tx.delete(User, { id: userId });
        });

        return { message: 'Account deleted' };
    }

    async deleteBanner(userId: number) {
        const result = await this.userRepository.update(
            { id: userId },
            { banner_url: null },
        );

        if (result.affected === 0) {
            throw new NotFoundException('User not found');
        }

        return { message: 'Banner removed' };
    }

    async uploadAvatar(userId: number, file: Express.Multer.File) {
        const url = await this.saveUpload(file, 'avatars');
        await this.userRepository.update({ id: userId }, { user_avatar_url: url });
        return { url };
    }

    async uploadBanner(userId: number, file: Express.Multer.File) {
        const url = await this.saveUpload(file, 'banners');
        await this.userRepository.update({ id: userId }, { banner_url: url });
        return { url };
    }

    async touchActivity(userId: number) {
        await this.userRepository.update(
            { id: userId },
            { last_seen_at: new Date() },
        );
    }

    async updatePresence(userId: number, status: PlatformUserStatus) {
        const now = new Date();
        await this.userRepository.update(
            { id: userId },
            {
                status,
                last_seen_at: now,
                status_updated_at: now,
            },
        );

        const user = await this.userRepository.findOne({
            where: { id: userId },
            select: ['id', 'username', 'status', 'last_seen_at'],
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    private toSelfProfile(user: User) {
        const { password, ...userData } = user as any;
        return {
            ...userData,
            last_seen_text: this.formatLastSeenText(user.last_seen_at),
        };
    }

    private maskEmail(email: string): string {
        const [local, domain] = email.split('@');
        if (!domain) return email;
        if (local.length <= 2) return `${local[0]}*@${domain}`;
        return `${local.slice(0, 2)}${'*'.repeat(Math.max(1, local.length - 3))}${local.slice(-1)}@${domain}`;
    }

    private formatLastSeenText(lastSeenAt: Date | null) {
        if (!lastSeenAt) {
            return 'never';
        }

        const diffMs = Date.now() - new Date(lastSeenAt).getTime();
        const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

        if (diffMinutes < 1) {
            return 'just now';
        }
        if (diffMinutes < 60) {
            return `${diffMinutes} min ago`;
        }

        const diffHours = Math.floor(diffMinutes / 60);
        if (diffHours < 24) {
            return `${diffHours} h ago`;
        }

        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays} d ago`;
    }

    private async saveUpload(file: Express.Multer.File, folder: string) {
        const targetDir = path.resolve(process.cwd(), 'uploads', folder);
        await fs.promises.mkdir(targetDir, { recursive: true });
        const ext = path.extname(file.originalname || '') || '.bin';
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
        await fs.promises.writeFile(path.join(targetDir, filename), file.buffer);
        return `/uploads/${folder}/${filename}`;
    }
}
