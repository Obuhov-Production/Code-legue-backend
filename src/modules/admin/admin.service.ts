import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Tournament } from '../tournaments/entities/tournament.entity';
import { Team } from '../teams/entities/team.entity';
import { Submission } from '../submissions/entities/submission.entity';
import { ChatRoomSettings } from '../chat-room-settings/entities/chat-room-setting.entity';
import * as bcrypt from 'bcrypt';
import { BulkUserAction, BulkUserActionDto } from './dto/bulk-user-action.dto';
import { SearchUsersDto } from './dto/search-users.dto';

@Injectable()
export class AdminService {
    constructor(
        @InjectRepository(User) private readonly userRepo: Repository<User>,
        @InjectRepository(Tournament) private readonly tournamentRepo: Repository<Tournament>,
        @InjectRepository(Team) private readonly teamRepo: Repository<Team>,
        @InjectRepository(Submission) private readonly submissionRepo: Repository<Submission>,
        @InjectRepository(ChatRoomSettings) private readonly chatSettingsRepo: Repository<ChatRoomSettings>,
    ) {}

    async getStats() {
        const [users, tournaments, teams, submissions] = await Promise.all([
            this.userRepo.count(),
            this.tournamentRepo.count(),
            this.teamRepo.count(),
            this.submissionRepo.count(),
        ]);
        return { users, tournaments, teams, submissions };
    }

    async getUserDailyStats(days: number) {
        const clampedDays = Math.min(Math.max(days, 1), 365);
        const rows: Array<{ date: string; count: string }> = await this.userRepo.query(
            `SELECT DATE(created_at) as date, COUNT(*) as count
             FROM users
             WHERE created_at >= DATE('now', '-' || ? || ' days')
             GROUP BY DATE(created_at)
             ORDER BY date ASC`,
            [clampedDays],
        );

        const countMap = new Map(rows.map(r => [r.date, Number(r.count)]));
        const result: Array<{ date: string; count: number }> = [];
        for (let i = clampedDays - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().slice(0, 10);
            result.push({ date: key, count: countMap.get(key) ?? 0 });
        }
        return result;
    }

    async getUsers() {
        const users = await this.userRepo.find({
            order: { created_at: 'DESC' },
        });

        return { users: users.map((user) => this.toAdminUser(user)) };
    }

    async searchUsers(query: SearchUsersDto) {
        const {
            q,
            role = 'all',
            sort_by = 'created_at',
            sort_desc = 'true',
        } = query;

        const total = await this.userRepo.count();

        const qb = this.userRepo.createQueryBuilder('user');

        if (q?.trim()) {
            qb.andWhere('(LOWER(user.username) LIKE :q OR LOWER(user.email) LIKE :q)', {
                q: `%${q.trim().toLowerCase()}%`,
            });
        }

        if (role && role !== 'all') {
            if (role === 'banned') {
                qb.andWhere('LOWER(user.role) LIKE :bannedRole', {
                    bannedRole: '%banned%',
                });
            } else {
                qb.andWhere('LOWER(user.role) LIKE :role', {
                    role: `%${role.toLowerCase()}%`,
                });
            }
        }

        const sortColumnMap = {
            username: 'user.username',
            email: 'user.email',
            role: 'user.role',
            created_at: 'user.created_at',
        } as const;

        qb.orderBy(sortColumnMap[sort_by], sort_desc === 'true' ? 'DESC' : 'ASC');

        const [users, filtered] = await qb.getManyAndCount();

        return {
            total,
            filtered,
            users: users.map((user) => this.toAdminUser(user)),
        };
    }

    async getMutedUsers() {
        const users = await this.userRepo.find({
            where: { is_chat_muted: true },
        });
        return users.map((user) => this.toAdminUser(user));
    }

    async updateUser(id: number, data: { role?: string; is_chat_muted?: boolean; status?: string }) {
        const user = await this.userRepo.findOne({ where: { id } });
        if (!user) throw new NotFoundException('User not found');
        Object.assign(user, data);
        const saved = await this.userRepo.save(user);
        return this.toAdminUser(saved);
    }

    async bulkAction(dto: BulkUserActionDto) {
        const users = await this.userRepo.find({
            where: dto.user_ids.map((id) => ({ id })),
        });

        if (users.length === 0) {
            throw new NotFoundException('Users not found');
        }

        switch (dto.action) {
            case BulkUserAction.BAN: {
                for (const user of users) {
                    if (!this.hasRole(user.role, 'banned')) {
                        user.role = this.appendRole(user.role, 'banned');
                    }
                    user.status = 'banned';
                }
                await this.userRepo.save(users);
                return { success: true, affected: users.length };
            }
            case BulkUserAction.UNBAN: {
                for (const user of users) {
                    user.role = this.removeRole(user.role, 'banned') || 'user';
                    if (user.status === 'banned') {
                        user.status = 'offline';
                    }
                }
                await this.userRepo.save(users);
                return { success: true, affected: users.length };
            }
            case BulkUserAction.DELETE: {
                await this.userRepo.remove(users);
                return { success: true, affected: users.length };
            }
            case BulkUserAction.CHANGE_ROLE: {
                if (!dto.role?.trim()) {
                    throw new BadRequestException('Role is required for change_role action');
                }
                for (const user of users) {
                    user.role = dto.role.trim();
                }
                await this.userRepo.save(users);
                return { success: true, affected: users.length };
            }
            default:
                throw new BadRequestException('Unsupported bulk action');
        }
    }

    async deleteUser(id: number, actorUserId?: number) {
        if (actorUserId && actorUserId === id) {
            throw new BadRequestException('Self-delete is not allowed');
        }
        const user = await this.userRepo.findOne({ where: { id } });
        if (!user) throw new NotFoundException('User not found');
        await this.userRepo.remove(user);
        return { message: 'User deleted' };
    }

    async resetUserPassword(userId: number, newPassword: string) {
        const user = await this.userRepo.findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await this.userRepo.update(userId, {
            password: hashedPassword,
        });

        return { message: 'Password updated successfully' };
    }

    async getTeams() {
        return this.teamRepo.find({
            relations: {
                tournament: true,
            },
        });
    }

    async getChatSettings(room: string) {
        const settings = await this.chatSettingsRepo.findOne({ where: { room } });
        return settings ?? { room, locked: 0, time_from: null, time_to: null };
    }

    async updateChatSettings(room: string, data: { locked?: number; time_from?: string | null; time_to?: string | null }) {
        let settings = await this.chatSettingsRepo.findOne({ where: { room } });
        if (!settings) {
            settings = this.chatSettingsRepo.create({ room, locked: 0, time_from: null, time_to: null });
        }
        Object.assign(settings, data);
        return this.chatSettingsRepo.save(settings);
    }

    async deleteTeam(id: number) {
        const team = await this.teamRepo.findOne({
            where: { id },
        });

        if (!team) {
            throw new NotFoundException('Team not found');
        }

        await this.teamRepo.delete(id);

        return { message: 'Team deleted successfully' };
    }

    private toAdminUser(user: User) {
        return {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            status: user.status,
            created_at: user.created_at,
            avatar_url: user.user_avatar_url ?? null,
            banner_color: user.banner_color ?? null,
            github_username: user.github_username ?? null,
            last_seen_at: user.last_seen_at ?? null,
            is_chat_muted: user.is_chat_muted,
        };
    }

    private hasRole(roles: string, targetRole: string) {
        return roles
            .split(',')
            .map((role) => role.trim())
            .filter(Boolean)
            .includes(targetRole);
    }

    private appendRole(roles: string, targetRole: string) {
        const roleSet = new Set(
            roles
                .split(',')
                .map((role) => role.trim())
                .filter(Boolean),
        );
        roleSet.add(targetRole);
        return Array.from(roleSet).join(',');
    }

    private removeRole(roles: string, targetRole: string) {
        return roles
            .split(',')
            .map((role) => role.trim())
            .filter((role) => role && role !== targetRole)
            .join(',');
    }
}
