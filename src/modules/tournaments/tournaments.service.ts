import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { InjectRepository } from "@nestjs/typeorm";
import { Tournament } from "./entities/tournament.entity";
import { In, LessThanOrEqual, Repository } from "typeorm";
import { TournamentStatus, STATUS_TRANSITIONS } from "./enums/TournamentStatus.enum";
import { UpdateTournamentDto } from "./dto/update-tournament.dto";
import { Team } from "../teams/entities/team.entity";
import { User } from '../users/entities/user.entity';
import { ChatRoom } from '../chat-room/entities/chat-room.entity';
import { ChatRoomMember } from '../teams/entities/chat-room-member.entity';
import { Round } from '../rounds/entities/round.entity';
import { RoundStatus } from '../rounds/enums/RoundStatus';
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
        @InjectRepository(ChatRoomMember)
        private readonly chatRoomMemberRepository: Repository<ChatRoomMember>,
        @InjectRepository(Round)
        private readonly roundRepository: Repository<Round>,
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

                // Auto-activate the first round
                await this.activateFirstRound(t.id);
                await this.emitTournamentUpdated(t.id, TournamentStatus.RUNNING, 'auto_status_changed');

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
                await this.emitTournamentUpdated(t.id, TournamentStatus.FINISHED, 'auto_status_changed');

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
                jury_members: true,
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
                jury_members: true,
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
            submission_start: dto.submission_start ? new Date(dto.submission_start) : null,
            submission_end: dto.submission_end ? new Date(dto.submission_end) : null,
            teams_limit: dto.teams_limit ?? null,
            rounds_count: dto.rounds_count ?? 1,
            min_team_size: dto.min_team_size ?? 2,
            max_team_size: dto.max_team_size ?? 5,
            elo_participation: dto.elo_participation ?? null,
            elo_per_round: dto.elo_per_round ?? null,
            elo_winner: dto.elo_winner ?? null,
            status: dto.status ?? TournamentStatus.DRAFT,
            ...(userId ? { created_by: { id: userId } as any, created_by_id: userId } : {}),
            parent_tournament_id: dto.parent_tournament_id ?? null,
        });

        const saved = await this.tournamentRepository.save(tournament);

        // Create tournament directory for file uploads
        const tourDir = path.resolve(process.cwd(), 'uploads', 'tournaments', String(saved.id));
        fs.mkdirSync(path.join(tourDir, 'rules'), { recursive: true });
        fs.mkdirSync(path.join(tourDir, 'tz'), { recursive: true });
        fs.mkdirSync(path.join(tourDir, 'misc'), { recursive: true });

        // If this tournament is a round of another tournament, create a Round record
        if (dto.parent_tournament_id) {
            const parent = await this.tournamentRepository.findOne({ where: { id: dto.parent_tournament_id } });
            if (parent) {
                const round = this.roundRepository.create({
                    tournament_id: parent.id,
                    title: saved.name,
                    description: saved.description,
                    tech_requirements: saved.tz,
                    start_date: saved.start_date,
                    end_date: saved.end_date,
                    status: RoundStatus.DRAFT,
                    sort_order: (parent.rounds?.length ?? 0),
                });
                await this.roundRepository.save(round);
                this.logger.log(`Created round #${round.id} for parent tournament #${parent.id} from child tournament #${saved.id}`);
            }
        }

        if (dto.jury_ids && dto.jury_ids.length > 0) {
            const juryIds = this.normalizeJuryIds(dto.jury_ids);
            const juryUsers = await this.userRepository.findBy({ id: In(juryIds) });
            this.assertAllJuryUsersFound(juryIds, juryUsers);
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
        const currentTournament = await this.assertCanEdit(id, user);

        const payload: any = { ...dto };
        if (dto.start_date) payload.start_date = new Date(dto.start_date);
        if (dto.end_date) payload.end_date = new Date(dto.end_date);
        if (dto.registration_start) payload.registration_start = new Date(dto.registration_start);
        if (dto.registration_end) payload.registration_end = new Date(dto.registration_end);
        if (dto.submission_start !== undefined) payload.submission_start = dto.submission_start ? new Date(dto.submission_start) : null;
        if (dto.submission_end !== undefined) payload.submission_end = dto.submission_end ? new Date(dto.submission_end) : null;
        const juryIds: number[] | undefined = Array.isArray(payload.jury_ids)
            ? this.normalizeJuryIds(payload.jury_ids)
            : undefined;
        delete payload.jury_ids;

        const result = await this.tournamentRepository.update({ id }, payload);

        if (result.affected === 0) {
            throw new NotFoundException('Tournament not found');
        }

        await this.syncRoundsAfterTournamentUpdate(currentTournament, payload);

        // Sync jury members when jury_ids is provided in update
        if (Array.isArray(juryIds)) {
            const tournament = await this.tournamentRepository.findOne({ where: { id }, relations: { jury_members: true } });
            if (tournament) {
                const previousJury = tournament.jury_members ?? [];
                const newJuryUsers = juryIds.length > 0
                    ? await this.userRepository.findBy({ id: In(juryIds) })
                    : [];
                this.assertAllJuryUsersFound(juryIds, newJuryUsers);
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

    async listFiles(id: number, type?: string) {
        const baseDir = path.resolve(process.cwd(), 'uploads', 'tournaments', String(id));
        const types = type ? [type] : ['rules', 'tz', 'misc'];
        const results: { type: string; files: { name: string; url: string }[] }[] = [];

        for (const t of types) {
            const dir = path.join(baseDir, t);
            if (!fs.existsSync(dir)) continue;
            const files = fs.readdirSync(dir)
                .filter(f => f !== '.' && f !== '..')
                .map(f => ({ name: f, url: `/uploads/tournaments/${id}/${t}/${f}` }));
            if (files.length > 0) {
                results.push({ type: t, files });
            }
        }

        return { tournament_id: id, files: results };
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

        // When manually transitioning to RUNNING, activate first round
        if (status === TournamentStatus.RUNNING) {
            await this.activateFirstRound(id);
        }

        await this.emitTournamentUpdated(id, status, 'status_changed');

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
                    this.addCriteriaBreakdown(criteriaBreakdown, evaluation.criteria);
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

    private normalizeJuryIds(value: unknown): number[] {
        if (!Array.isArray(value)) {
            throw new BadRequestException('jury_ids must be an array');
        }

        const normalized = value.map((id) => Number(id));
        const hasInvalid = normalized.some((id) => !Number.isInteger(id) || id <= 0);
        if (hasInvalid) {
            throw new BadRequestException('jury_ids contains invalid user id');
        }

        return Array.from(new Set(normalized));
    }

    private assertAllJuryUsersFound(juryIds: number[], users: User[]) {
        if (users.length !== juryIds.length) {
            throw new BadRequestException('One or more jury users were not found');
        }
    }

    private async emitTournamentUpdated(tournamentId: number, status: TournamentStatus, reason = 'status_changed') {
        const teams = await this.teamRepository.find({
            where: { tournament_id: tournamentId },
            relations: { members: true },
        });
        const userIds = new Set<number>();

        for (const team of teams) {
            if (team.captain_id) userIds.add(team.captain_id);
            for (const member of team.members ?? []) {
                if (member.status !== 'accepted') continue;
                if (member.user_id) userIds.add(member.user_id);
            }
        }

        userIds.forEach((userId) => {
            try {
                this.chatGateway.sendToUser(userId, 'tournament:updated', {
                    reason,
                    tournamentId,
                    tournament_id: tournamentId,
                    status,
                });
            } catch {}
        });
    }

    private async syncRoundsAfterTournamentUpdate(previous: Tournament, payload: any) {
        const hasRoundFieldChange = [
            'name',
            'description',
            'tz',
            'start_date',
            'end_date',
        ].some((key) => Object.prototype.hasOwnProperty.call(payload, key));

        if (!hasRoundFieldChange) return;

        const roundPatch: Partial<Round> = {};
        if (Object.prototype.hasOwnProperty.call(payload, 'name')) roundPatch.title = payload.name;
        if (Object.prototype.hasOwnProperty.call(payload, 'description')) roundPatch.description = payload.description ?? null;
        if (Object.prototype.hasOwnProperty.call(payload, 'tz')) roundPatch.tech_requirements = payload.tz ?? null;
        if (Object.prototype.hasOwnProperty.call(payload, 'start_date')) roundPatch.start_date = payload.start_date;
        if (Object.prototype.hasOwnProperty.call(payload, 'end_date')) roundPatch.end_date = payload.end_date;

        if (Object.keys(roundPatch).length === 0) return;

        if (previous.parent_tournament_id) {
            await this.roundRepository.update(
                { tournament_id: previous.parent_tournament_id, title: previous.name },
                roundPatch,
            );
            return;
        }

        const rounds = await this.roundRepository.find({
            where: { tournament_id: previous.id },
            order: { sort_order: 'ASC', start_date: 'ASC', id: 'ASC' },
        });

        if (rounds.length !== 1) return;

        const [round] = rounds;
        const isDefaultRound = round.sort_order === 0 && (
            round.title === 'Round 1' ||
            round.title === 'Раунд 1' ||
            (previous.tz != null && round.description === previous.tz)
        );

        if (isDefaultRound) {
            await this.roundRepository.update({ id: round.id }, roundPatch);
        }
    }

    private addCriteriaBreakdown(target: Record<string, number>, rawCriteria: unknown) {
        for (const item of this.normalizeCriteria(rawCriteria)) {
            target[item.label] = (target[item.label] ?? 0) + item.score;
        }
    }

    private normalizeCriteria(rawCriteria: unknown): Array<{ label: string; score: number }> {
        if (!rawCriteria) return [];

        let criteria = rawCriteria;
        if (typeof criteria === 'string') {
            try {
                criteria = JSON.parse(criteria);
            } catch {
                return [];
            }
        }

        if (Array.isArray(criteria)) {
            return criteria
                .map((item, index) => this.normalizeCriterionItem(String(index), item))
                .filter((item): item is { label: string; score: number } => item !== null);
        }

        if (typeof criteria === 'object') {
            return Object.entries(criteria as Record<string, unknown>)
                .map(([key, value]) => this.normalizeCriterionItem(key, value))
                .filter((item): item is { label: string; score: number } => item !== null);
        }

        return [];
    }

    private normalizeCriterionItem(key: string, value: unknown): { label: string; score: number } | null {
        if (value && typeof value === 'object') {
            const item = value as Record<string, unknown>;
            const rawScore = item.score ?? item.value ?? item.total ?? 0;
            const score = Number(rawScore);
            if (!Number.isFinite(score)) return null;
            const label = String(item.label ?? item.key ?? key).trim();
            return { label: label || key, score };
        }

        const score = Number(value);
        if (!Number.isFinite(score)) return null;
        return { label: key, score };
    }

    async delete(id: number, user: { userId?: number; role?: string }) {
        await this.assertCanEdit(id, user);

        // Clean up team chat artefacts BEFORE deleting the tournament,
        // because chat rooms/members/messages are NOT linked by FK to teams.
        const teams = await this.teamRepository.find({ where: { tournament_id: id } });
        for (const team of teams) {
            const room = `team_${team.id}`;
            await this.chatRoomMemberRepository.delete({ room });
            await this.tournamentRepository.query('DELETE FROM messages WHERE room = ?', [room]);
            await this.chatRoomRepository.delete({ name: room });
        }
        if (teams.length > 0) {
            this.logger.log(`Deleted ${teams.length} team chat room(s) for tournament #${id}`);
        }

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

    /**
     * Activate the first round of a tournament (by sort_order, then start_date).
     * If no rounds exist, auto-create a default "Раунд 1" round.
     * Only activates if no round is already active.
     */
    async activateFirstRound(tournamentId: number) {
        let rounds = await this.roundRepository.find({
            where: { tournament_id: tournamentId },
            order: { sort_order: 'ASC', start_date: 'ASC', id: 'ASC' },
        });

        // Auto-create default round if none exist
        if (rounds.length === 0) {
            const tournament = await this.tournamentRepository.findOne({ where: { id: tournamentId } });
            if (!tournament) return null;
            const defaultRound = this.roundRepository.create({
                tournament_id: tournamentId,
                title: 'Раунд 1',
                description: tournament.tz ?? null,
                tech_requirements: null,
                start_date: tournament.start_date,
                end_date: tournament.end_date,
                status: RoundStatus.ACTIVE,
                sort_order: 0,
            });
            const saved = await this.roundRepository.save(defaultRound);
            this.logger.log(`Auto-created default round #${saved.id} for tournament #${tournamentId}`);
            return saved;
        }

        const alreadyActive = rounds.find(r => r.status === RoundStatus.ACTIVE);
        if (alreadyActive) return alreadyActive;

        const first = rounds[0];
        if (first.status === RoundStatus.DRAFT) {
            first.status = RoundStatus.ACTIVE;
            await this.roundRepository.save(first);
            this.logger.log(`Auto-activated round #${first.id} "${first.title}" for tournament #${tournamentId}`);
        }
        return first;
    }

    /**
     * Advance to the next round: close current active round, activate the next one.
     * Used by organizer panel: - {round} + buttons.
     * direction: 1 = next, -1 = previous (re-activate)
     */
    async advanceRound(tournamentId: number, direction: number, user: { userId?: number; role?: string }) {
        await this.assertCanEdit(tournamentId, user);

        const rounds = await this.roundRepository.find({
            where: { tournament_id: tournamentId },
            order: { sort_order: 'ASC', start_date: 'ASC', id: 'ASC' },
        });
        if (rounds.length === 0) {
            throw new BadRequestException('No rounds exist for this tournament');
        }

        const activeIdx = rounds.findIndex(r => r.status === RoundStatus.ACTIVE);

        if (direction > 0) {
            // Next round
            if (activeIdx >= 0) {
                rounds[activeIdx].status = RoundStatus.SUBMISSION_CLOSED;
                await this.roundRepository.save(rounds[activeIdx]);
            }
            const nextIdx = activeIdx < 0 ? 0 : activeIdx + 1;
            if (nextIdx >= rounds.length) {
                throw new BadRequestException('No more rounds to advance to');
            }
            rounds[nextIdx].status = RoundStatus.ACTIVE;
            await this.roundRepository.save(rounds[nextIdx]);
            return { success: true, active_round: this.roundToResponse(rounds[nextIdx]), index: nextIdx, total: rounds.length };
        } else {
            // Previous round (re-activate)
            if (activeIdx >= 0) {
                rounds[activeIdx].status = RoundStatus.DRAFT;
                await this.roundRepository.save(rounds[activeIdx]);
            }
            const prevIdx = activeIdx <= 0 ? 0 : activeIdx - 1;
            rounds[prevIdx].status = RoundStatus.ACTIVE;
            await this.roundRepository.save(rounds[prevIdx]);
            return { success: true, active_round: this.roundToResponse(rounds[prevIdx]), index: prevIdx, total: rounds.length };
        }
    }

    /**
     * Get the current active round for a tournament.
     */
    async getActiveRound(tournamentId: number) {
        const round = await this.roundRepository.findOne({
            where: { tournament_id: tournamentId, status: RoundStatus.ACTIVE },
        });
        if (!round) return null;
        return this.roundToResponse(round);
    }

    private roundToResponse(round: Round) {
        return {
            id: round.id,
            tournament_id: round.tournament_id,
            title: round.title,
            description: round.description,
            tech_requirements: round.tech_requirements,
            must_have_items: round.must_have_items ?? [],
            materials: round.materials ?? [],
            start_date: round.start_date,
            end_date: round.end_date,
            status: round.status,
            sort_order: round.sort_order,
            max_teams_pass: round.max_teams_pass,
            rules_file_url: round.rules_file_url,
            tz_file_url: round.tz_file_url,
        };
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
