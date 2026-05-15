import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Tournament } from '../tournaments/entities/tournament.entity';
import { Team } from '../teams/entities/team.entity';
import { Submission } from '../submissions/entities/submission.entity';
import { ChatRoomSettings } from '../chat-room-settings/entities/chat-room-setting.entity';
import { Message } from '../chat-messages/entities/chat-message.entity';
import { ChatRoom } from '../chat-room/entities/chat-room.entity';
import * as bcrypt from 'bcrypt';
import { BulkUserAction, BulkUserActionDto } from './dto/bulk-user-action.dto';
import { SearchUsersDto } from './dto/search-users.dto';
import { ChatGateway } from '../chat-messages/chat.gateway';

@Injectable()
export class AdminService {
    constructor(
        @InjectRepository(User) private readonly userRepo: Repository<User>,
        @InjectRepository(Tournament) private readonly tournamentRepo: Repository<Tournament>,
        @InjectRepository(Team) private readonly teamRepo: Repository<Team>,
        @InjectRepository(Submission) private readonly submissionRepo: Repository<Submission>,
        @InjectRepository(ChatRoomSettings) private readonly chatSettingsRepo: Repository<ChatRoomSettings>,
        @InjectRepository(Message) private readonly messageRepo: Repository<Message>,
        @InjectRepository(ChatRoom) private readonly chatRoomRepo: Repository<ChatRoom>,
        private readonly chatGateway: ChatGateway,
    ) {}

    async getStats() {
        const [users, tournaments, teams, submissions, messages] = await Promise.all([
            this.userRepo.count(),
            this.tournamentRepo.count(),
            this.teamRepo.count(),
            this.submissionRepo.count(),
            this.messageRepo.count({ where: { deleted: false } as any }),
        ]);

        // Message trend: compare last 30 days vs previous 30 days
        const [msgLast, msgPrev] = await Promise.all([
            this.messageRepo.query(
                `SELECT COUNT(*) as cnt FROM messages WHERE deleted = 0 AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
            ),
            this.messageRepo.query(
                `SELECT COUNT(*) as cnt FROM messages WHERE deleted = 0 AND created_at >= DATE_SUB(NOW(), INTERVAL 60 DAY) AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)`,
            ),
        ]);
        const last30 = Number(msgLast[0]?.cnt ?? 0);
        const prev30 = Number(msgPrev[0]?.cnt ?? 0);
        const messages_trend = prev30 === 0
            ? (last30 > 0 ? 100 : 0)
            : Math.round(((last30 - prev30) / prev30) * 100);

        return { users, tournaments, teams, submissions, messages, messages_trend };
    }

    async getUserDailyStats(days: number, metric = 'users') {
        const clampedDays = Math.min(Math.max(days, 1), 365);

        const sources: Record<string, { repo: Repository<any>; table: string; where?: string }> = {
            users:        { repo: this.userRepo,       table: 'users' },
            chat:         { repo: this.messageRepo,    table: 'messages',     where: 'deleted = 0' },
            tournaments:  { repo: this.tournamentRepo, table: 'tournaments' },
            teams:        { repo: this.teamRepo,       table: 'teams' },
            submissions:  { repo: this.submissionRepo, table: 'submissions' },
        };
        const src = sources[metric] ?? sources.users;

        const whereClauses = [`created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`];
        if (src.where) whereClauses.push(src.where);

        const rows: Array<{ date: Date | string; count: string | number }> = await src.repo.query(
            `SELECT DATE(created_at) as date, COUNT(*) as count
             FROM ${src.table}
             WHERE ${whereClauses.join(' AND ')}
             GROUP BY DATE(created_at)
             ORDER BY date ASC`,
            [clampedDays - 1],
        );

        const toKey = (d: Date | string) => {
            const dt = d instanceof Date ? d : new Date(d);
            const y = dt.getFullYear();
            const m = String(dt.getMonth() + 1).padStart(2, '0');
            const day = String(dt.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        };
        const countMap = new Map(rows.map(r => [toKey(r.date), Number(r.count)]));

        const result: Array<{ date: string; count: number }> = [];
        for (let i = clampedDays - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = toKey(d);
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
        const prevRole = user.role;
        Object.assign(user, data);
        const saved = await this.userRepo.save(user);
        if (data.role !== undefined && data.role !== prevRole) {
            this.chatGateway.sendToUser(id, 'user:updated', {
                reason: 'role_changed',
                role: saved.role,
            });
        }
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
        const teams = await this.teamRepo.find({
            relations: {
                tournament: true,
                captain: true,
                members: true,
            },
            order: { id: 'DESC' },
        });

        return teams.map((team) => {
            const acceptedMembers = (team.members || []).filter((member) => member.status !== 'rejected');
            const captainMember = (team.members || []).find((member) => member.user_id === team.captain_id);
            return {
                id: team.id,
                name: team.name,
                tournament_id: team.tournament_id,
                tournament_name: team.tournament?.name ?? null,
                tournament_status: team.tournament?.status ?? null,
                captain_id: team.captain_id,
                captain_name: team.captain?.username ?? captainMember?.fullName ?? null,
                captain_email: team.captain?.email ?? captainMember?.email ?? team.leader_email ?? null,
                members_count: acceptedMembers.length,
                pending_members_count: (team.members || []).filter((member) => member.status === 'pending').length,
                city: team.city,
                school: team.school,
                created_at: team.created_at,
                members: (team.members || []).map((member) => ({
                    id: member.id,
                    full_name: member.fullName,
                    email: member.email,
                    user_id: member.user_id,
                    status: member.status,
                })),
            };
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

        // Chat-related rows are linked by string `team_<id>`, not by FK, so they
        // won't cascade. Wipe them explicitly to keep chat_rooms clean.
        const room = `team_${id}`;
        await this.userRepo.query('DELETE FROM chat_room_members WHERE room = ?', [room]);
        await this.userRepo.query('DELETE FROM messages WHERE room = ?', [room]);
        await this.userRepo.query('DELETE FROM chat_rooms WHERE name = ?', [room]);

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

    async createChatRoom(name: string, label: string, userId: number) {
        const existing = await this.chatRoomRepo.findOne({ where: { name } });
        if (existing) throw new BadRequestException('Кімната з таким іменем вже існує');
        const room = this.chatRoomRepo.create({ name, label, created_by: userId });
        return this.chatRoomRepo.save(room);
    }

    async deleteChatRoom(id: number) {
        const room = await this.chatRoomRepo.findOne({ where: { id } });
        if (!room) throw new NotFoundException('Кімнату не знайдено');
        await this.chatRoomRepo.remove(room);
        return { success: true };
    }
}
