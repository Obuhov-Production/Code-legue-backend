import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { InjectRepository } from "@nestjs/typeorm";
import { Tournament } from "./entities/tournament.entity";
import { LessThanOrEqual, Repository } from "typeorm";
import { TournamentStatus, STATUS_TRANSITIONS } from "./enums/TournamentStatus.enum";
import { UpdateTournamentDto } from "./dto/update-tournament.dto";
import { Team } from "../teams/entities/team.entity";
import { User } from '../users/entities/user.entity';
import { ChatRoom } from '../chat-room/entities/chat-room.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { ChatGateway } from '../chat-messages/chat.gateway';
import * as fs from 'fs';
import * as path from 'path';


@Injectable()
export class TournamentsService implements OnModuleInit {
    private readonly logger = new Logger(TournamentsService.name);

    constructor(
        @InjectRepository(Tournament)
        private readonly tournamentRepository: Repository<Tournament>,
        @InjectRepository(Team)
        private readonly teamRepository: Repository<Team>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(ChatRoom)
        private readonly chatRoomRepository: Repository<ChatRoom>,
        private readonly notificationsService: NotificationsService,
        private readonly chatGateway: ChatGateway,
    ) {}

    onModuleInit() {
        this.autoTransitionStatuses();
        setInterval(() => this.autoTransitionStatuses(), 5 * 60 * 1000);
    }

    async autoTransitionStatuses() {
        const now = new Date();
        try {
            // Registration → Running (after registration_end)
            const regToRun = await this.tournamentRepository.find({
                where: { status: TournamentStatus.REGISTRATION, registration_end: LessThanOrEqual(now) },
            });
            for (const t of regToRun) {
                await this.tournamentRepository.update({ id: t.id }, { status: TournamentStatus.RUNNING });
                this.logger.log(`Auto-transition: tournament #${t.id} "${t.name}" → RUNNING`);
                const notifs = await this.notificationsService.notifyAdmins(
                    `Турнір "${t.name}" автоматично переведено в RUNNING`,
                    '🚀',
                    'admin',
                );
                notifs.forEach(n => {
                    try { this.chatGateway.sendToUser(n.userId, 'notification:new', n); } catch {}
                });
            }

            // Running → Finished (after end_date)
            const runToFin = await this.tournamentRepository.find({
                where: { status: TournamentStatus.RUNNING, end_date: LessThanOrEqual(now) },
            });
            for (const t of runToFin) {
                await this.tournamentRepository.update({ id: t.id }, { status: TournamentStatus.FINISHED });
                this.logger.log(`Auto-transition: tournament #${t.id} "${t.name}" → FINISHED`);

                // Delete team chat rooms for this tournament
                const teams = await this.teamRepository.find({ where: { tournament_id: t.id } });
                for (const team of teams) {
                    await this.chatRoomRepository.delete({ name: `team_${team.id}` }).catch(() => {});
                }
                if (teams.length > 0) {
                    this.logger.log(`Deleted ${teams.length} team chat room(s) for tournament #${t.id}`);
                }

                const notifs = await this.notificationsService.notifyAdmins(
                    `Турнір "${t.name}" автоматично завершено (FINISHED)`,
                    '🏁',
                    'admin',
                );
                notifs.forEach(n => {
                    try { this.chatGateway.sendToUser(n.userId, 'notification:new', n); } catch {}
                });
            }
        } catch (err: unknown) {
            this.logger.error('autoTransitionStatuses error:', (err as Error)?.message ?? String(err));
        }
    }

    async getAll(status?: TournamentStatus) {
        const where = status ? { status } : {};

        const tournaments = await this.tournamentRepository.find({
            where,
            relations: {
                created_by: true,
                teams: true,
            },
            order: {
                created_at: 'DESC',
            },
        });

        return tournaments.map((t) => ({
            ...t,
            creator_name: t.created_by?.username,
            teams_count: t.teams?.length ?? 0,
        }));
    }


    async getById(id: number) {
        const tournament = await this.tournamentRepository.findOne({
            where: { id },
            relations: {
                created_by: true,
                teams: true,
            },
        });

        if (!tournament) {
            throw new NotFoundException('Tournament not found');
        }

        const canViewTz =
            tournament.tz_enabled ||
            tournament.status === TournamentStatus.RUNNING ||
            tournament.status === TournamentStatus.FINISHED;

        return {
            ...tournament,
            tz: canViewTz ? tournament.tz : null,
            creator_name: tournament.created_by?.username,
            teams_count: tournament.teams?.length ?? 0,
        };
    }

    async create(dto: CreateTournamentDto, userId?: number) {
        const tournament = this.tournamentRepository.create({
            name: dto.name,
            description: dto.description ?? null,
            rules: dto.rules ?? null,
            rules_mode: dto.rules_mode ?? null,
            rules_file_url: dto.rules_file_url ?? null,
            additional_prizes: dto.additional_prizes ?? null,
            category: dto.category ?? null,
            format: dto.format ?? null,
            prize: dto.prize ?? null,
            emoji: dto.emoji ?? null,
            tz: dto.tz ?? null,
            tz_enabled: dto.tz_enabled ?? false,
            start_date: new Date(dto.start_date),
            end_date: new Date(dto.end_date),
            registration_start: new Date(dto.registration_start),
            registration_end: new Date(dto.registration_end),
            teams_limit: dto.teams_limit ?? null,
            rounds_count: dto.rounds_count ?? 1,
            min_team_size: dto.min_team_size ?? 2,
            max_team_size: dto.max_team_size ?? 5,
            elo_participation: dto.elo_participation ?? null,
            elo_per_round: dto.elo_per_round ?? null,
            elo_winner: dto.elo_winner ?? null,
            status: dto.status ?? TournamentStatus.DRAFT,
            ...(userId ? { created_by: { id: userId } as any, created_by_id: userId } : {}),
        });

        const saved = await this.tournamentRepository.save(tournament);

        // Create tournament directory for file uploads
        const tourDir = path.resolve(process.cwd(), 'uploads', 'tournaments', String(saved.id));
        fs.mkdirSync(path.join(tourDir, 'rules'), { recursive: true });
        fs.mkdirSync(path.join(tourDir, 'tz'), { recursive: true });
        fs.mkdirSync(path.join(tourDir, 'misc'), { recursive: true });

        if (dto.jury_ids && dto.jury_ids.length > 0) {
            const juryUsers = await this.userRepository.findBy(dto.jury_ids.map(id => ({ id })));
            saved.jury_members = juryUsers;
            await this.tournamentRepository.save(saved);
            await this.ensureJuryRole(juryUsers);
        }

        const adminNotifs = await this.notificationsService.notifyAdmins(
            `Створено новий турнір: ${dto.name}`,
            '🏆',
            'admin',
        );
        adminNotifs.forEach(n => {
            try { this.chatGateway.sendToUser(n.userId, 'notification:new', n); } catch {}
        });

        return saved;
    }

    /** Admins may edit anyone's tournament; organizers only their own. */
    private async assertCanEdit(tournamentId: number, user: { userId?: number; role?: string }) {
        const tournament = await this.tournamentRepository.findOne({
            where: { id: tournamentId },
            relations: { created_by: true },
        });
        if (!tournament) throw new NotFoundException('Tournament not found');

        const roles = (user?.role || '').toLowerCase().split(',').map((r) => r.trim());
        if (roles.includes('admin')) return tournament;

        const ownerId = tournament.created_by_id ?? tournament.created_by?.id ?? null;
        if (!ownerId || ownerId !== user?.userId) {
            throw new ForbiddenException(
                'Редагувати цей турнір може лише організатор, який його створив, або адміністратор',
            );
        }
        return tournament;
    }

    async update(id: number, dto: UpdateTournamentDto, user: { userId?: number; role?: string }) {
        await this.assertCanEdit(id, user);

        const payload: any = { ...dto };
        if (dto.start_date) payload.start_date = new Date(dto.start_date);
        if (dto.end_date) payload.end_date = new Date(dto.end_date);
        if (dto.registration_start) payload.registration_start = new Date(dto.registration_start);
        if (dto.registration_end) payload.registration_end = new Date(dto.registration_end);
        const juryIds: number[] | undefined = payload.jury_ids;
        delete payload.jury_ids;

        const result = await this.tournamentRepository.update({ id }, payload);

        if (result.affected === 0) {
            throw new NotFoundException('Tournament not found');
        }

        // Sync jury members when jury_ids is provided in update
        if (Array.isArray(juryIds)) {
            const tournament = await this.tournamentRepository.findOne({ where: { id }, relations: { jury_members: true } });
            if (tournament) {
                const previousJury = tournament.jury_members ?? [];
                const newJuryUsers = await this.userRepository.findBy(juryIds.map(uid => ({ id: uid })));
                tournament.jury_members = newJuryUsers;
                await this.tournamentRepository.save(tournament);

                // Add jury role to newly assigned users
                await this.ensureJuryRole(newJuryUsers);

                // Remove jury role from users who were removed (if they are not jury in other tournaments)
                const removedUsers = previousJury.filter(u => !juryIds.includes(u.id));
                await this.removeJuryRoleIfNotNeeded(removedUsers);
            }
        }

        return { success: true };
    }

    async uploadFile(id: number, type: 'rules' | 'tz' | 'misc', file: Express.Multer.File, user: { userId?: number; role?: string }) {
        await this.assertCanEdit(id, user);

        const tourDir = path.resolve(process.cwd(), 'uploads', 'tournaments', String(id), type);
        fs.mkdirSync(tourDir, { recursive: true });

        const ext = path.extname(file.originalname || '') || '.bin';
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
        fs.writeFileSync(path.join(tourDir, filename), file.buffer);

        const url = `/uploads/tournaments/${id}/${type}/${filename}`;

        if (type === 'rules') {
            await this.tournamentRepository.update({ id }, { rules_file_url: url });
        }

        return { url, filename: file.originalname };
    }

    async updateStatus(id: number, status: TournamentStatus, user: { userId?: number; role?: string }) {
        const tournament = await this.assertCanEdit(id, user);

        const allowAny = process.env.ALLOW_WRITE_TOURNAMENT_STATUS === 'true';
        if (!allowAny) {
            const allowed = STATUS_TRANSITIONS[tournament.status] ?? [];
            if (!allowed.includes(status)) {
                throw new BadRequestException(
                    `Cannot transition from "${tournament.status}" to "${status}". ` +
                    `Allowed: [${allowed.join(', ') || 'none'}]`,
                );
            }
        }

        await this.tournamentRepository.update({ id }, { status });
        return { success: true, status };
    }

    async getLeaderboard(tournamentId: number) {
        const tournament = await this.tournamentRepository.findOne({ where: { id: tournamentId } });
        if (!tournament) throw new NotFoundException('Tournament not found');

        const teams = await this.teamRepository.find({
            where: { tournament_id: tournamentId },
            relations: { captain: true, members: true, submissions: { evaluations: true } },
        });

        const ranked = teams.map((t) => {
            let totalScore = 0;
            const criteriaBreakdown: Record<string, number> = {};

            for (const submission of t.submissions ?? []) {
                for (const evaluation of submission.evaluations ?? []) {
                    totalScore += Number(evaluation.total_score || 0);
                    const criteria = (evaluation.criteria || {}) as Record<string, number>;
                    for (const [key, value] of Object.entries(criteria)) {
                        criteriaBreakdown[key] = (criteriaBreakdown[key] ?? 0) + Number(value || 0);
                    }
                }
            }

            return {
                team_id: t.id,
                team_name: t.name,
                captain: t.captain?.username ?? null,
                members_count: t.members?.length ?? 0,
                city: t.city ?? null,
                school: t.school ?? null,
                total_score: totalScore,
                criteria_breakdown: criteriaBreakdown,
            };
        }).sort((a, b) => b.total_score - a.total_score);

        return ranked.map((item, index) => ({
            rank: index + 1,
            ...item,
        }));
    }

    async delete(id: number, user: { userId?: number; role?: string }) {
        await this.assertCanEdit(id, user);

        const result = await this.tournamentRepository.delete({ id });

        if (result.affected === 0) {
            throw new NotFoundException('Tournament not found');
        }

        return { success: true };
    }

    /**
     * Add 'jury' role to users who don't already have it.
     */
    private async ensureJuryRole(users: User[]) {
        for (const user of users) {
            const roles = (user.role || '').split(',').map(r => r.trim()).filter(Boolean);
            if (!roles.includes('jury')) {
                roles.push('jury');
                user.role = roles.join(',');
                await this.userRepository.save(user);
            }
        }
    }

    /**
     * Remove 'jury' role from users if they are no longer jury in any tournament.
     */
    private async removeJuryRoleIfNotNeeded(users: User[]) {
        for (const user of users) {
            const roles = (user.role || '').split(',').map(r => r.trim()).filter(Boolean);
            if (!roles.includes('jury')) continue;

            // Check if user is still jury in any tournament
            const count = await this.tournamentRepository
                .createQueryBuilder('t')
                .innerJoin('tournament_jury_members', 'tjm', 'tjm.tournament_id = t.id')
                .where('tjm.user_id = :uid', { uid: user.id })
                .getCount();

            if (count === 0) {
                user.role = roles.filter(r => r !== 'jury').join(',') || 'user';
                await this.userRepository.save(user);
            }
        }
    }

    async getAssignedJury(tournamentId: number) {
        const tournament = await this.tournamentRepository.findOne({
            where: { id: tournamentId },
            relations: { jury_members: true },
        });

        return (tournament?.jury_members ?? []).map(u => ({
            id: u.id,
            username: u.username,
            email: u.email,
            role: u.role,
            user_avatar_url: u.user_avatar_url ?? null,
        }));
    }
}
