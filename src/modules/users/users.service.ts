import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PlatformUserStatus } from './dto/update-status.dto';
import * as fs from 'fs';
import * as path from 'path';
import { Badge } from '../badges/entities/badge.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User) private userRepository: Repository<User>,
        @InjectRepository(Badge) private badgeRepository: Repository<Badge>,
    ) {}

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
