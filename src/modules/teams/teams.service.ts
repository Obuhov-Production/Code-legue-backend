import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from './entities/team.entity';
import { CreateTeamDto } from './dto/create-team.dto';
import { TeamMember } from '../team-members/entities/team-member.entity';
import { Tournament } from '../tournaments/entities/tournament.entity';
import { TournamentStatus } from '../tournaments/enums/TournamentStatus.enum';
import { TournamentRepository } from './entities/tournament-repository.entity';
import { UpsertTeamRepositoryDto } from './dto/upsert-team-repository.dto';
import { User } from '../users/entities/user.entity';
import { CreateCodeCommentDto } from './dto/create-code-comment.dto';
import { CodeReview } from './entities/code-review.entity';
import { ChatRoomMember } from './entities/chat-room-member.entity';
import { Badge } from '../badges/entities/badge.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { ChatRoom } from '../chat-room/entities/chat-room.entity';

@Injectable()
export class TeamsService {
    constructor(
        @InjectRepository(Team) private readonly teamRepo: Repository<Team>,
        @InjectRepository(TeamMember) private readonly memberRepo: Repository<TeamMember>,
        @InjectRepository(Tournament) private readonly tournamentRepo: Repository<Tournament>,
        @InjectRepository(User) private readonly userRepo: Repository<User>,
        @InjectRepository(TournamentRepository) private readonly tournamentRepositoryRepo: Repository<TournamentRepository>,
        @InjectRepository(CodeReview) private readonly codeReviewRepo: Repository<CodeReview>,
        @InjectRepository(ChatRoomMember) private readonly chatRoomMemberRepo: Repository<ChatRoomMember>,
        @InjectRepository(Badge) private readonly badgeRepo: Repository<Badge>,
        @InjectRepository(ChatRoom) private readonly chatRoomRepo: Repository<ChatRoom>,
        private readonly notificationsService: NotificationsService,
    ) {}

    private async sendInviteNotification(memberId: number, userId: number, teamName: string, tournamentName: string | null) {
        const tournamentSuffix = tournamentName ? ` (турнір "${tournamentName}")` : '';
        await this.notificationsService.create({
            userId,
            message: `Вас запросили в команду "${teamName}"${tournamentSuffix}`,
            icon: 'team_invite',
            link_tab: `team_invite:${memberId}`,
        });
    }

    async findMyTeams(userId: number): Promise<any[]> {
        const captainTeams = await this.teamRepo.find({
            where: { captain_id: userId },
            relations: ['tournament'],
        });

        const memberRecords = await this.memberRepo.find({
            where: { user_id: userId, status: 'accepted' },
            relations: ['team', 'team.tournament'],
        });

        const captainIds = new Set(captainTeams.map((t) => t.id));
        const memberTeams = memberRecords
            .map((m) => m.team)
            .filter((t) => t && !captainIds.has(t.id));

        const allTeams = [...captainTeams, ...memberTeams];

        // Lazily backfill chat rooms that were missing (e.g. teams created before
        // the auto-creation fix). Also ensures the requesting user has a membership row.
        for (const t of allTeams) {
            const roomName = `team_${t.id}`;
            const existingRoom = await this.chatRoomRepo.findOne({ where: { name: roomName } });
            if (!existingRoom) {
                await this.chatRoomRepo.save(
                    this.chatRoomRepo.create({
                        name: roomName,
                        label: t.name,
                        created_by: t.captain_id ?? userId,
                    }),
                );
            }
            const existingMember = await this.chatRoomMemberRepo.findOne({
                where: { room: roomName, user_id: userId },
            });
            if (!existingMember) {
                await this.chatRoomMemberRepo.save(
                    this.chatRoomMemberRepo.create({
                        room: roomName,
                        user_id: userId,
                        added_by: t.captain_id,
                    }),
                );
            }
        }

        return allTeams.map((t) => ({
            id: t.id,
            name: t.name,
            city: t.city,
            school: t.school,
            telegram_username: t.telegram_username,
            captain_id: t.captain_id,
            tournament_id: t.tournament_id,
            tournament_name: t.tournament?.name ?? null,
            tournament_status: t.tournament?.status ?? null,
            tournament_submission_start: t.tournament?.submission_start ?? null,
            tournament_submission_end: t.tournament?.submission_end ?? null,
        }));
    }

    async createTeam(dto: CreateTeamDto, user: any) {
        const captainId = user.userId;

        const tournament = await this.tournamentRepo.findOne({
            where: { id: dto.tournament_id },
        });

        if (!tournament) {
            throw new NotFoundException('Tournament not found');
        }

        if (tournament.status !== TournamentStatus.REGISTRATION) {
            throw new BadRequestException('Team registration is only available during registration stage');
        }

        const existingCaptainTeam = await this.teamRepo.findOne({
            where: {
                tournament_id: dto.tournament_id,
                captain_id: captainId,
            },
        });

        if (existingCaptainTeam) {
            throw new ConflictException('You are already registered in this tournament');
        }

        const existingNamedTeam = await this.teamRepo.findOne({
            where: {
                name: dto.name,
                tournament_id: dto.tournament_id,
            },
        });

        if (existingNamedTeam) {
            throw new ConflictException('Team with this name already exists in this tournament');
        }

        if (tournament.teams_limit) {
            const teamsCount = await this.getTeamsCount(dto.tournament_id);
            if (teamsCount >= tournament.teams_limit) {
                throw new ConflictException('Teams limit reached for this tournament');
            }
        }

        // Validate platform-linked members BEFORE creating the team — fail fast,
        // no orphaned team if any participant hasn't confirmed their full name.
        if (dto.members && dto.members.length > 0) {
            for (const m of dto.members) {
                if (m.user_id) {
                    const linkedUser = await this.userRepo.findOne({ where: { id: m.user_id } });
                    if (!linkedUser || !linkedUser.first_name || !linkedUser.last_name || !linkedUser.middle_name) {
                        const username = linkedUser?.username ?? `user#${m.user_id}`;
                        throw new BadRequestException(`Учасник ${username} ще не підтвердив своє ПІБ у профілі`);
                    }
                }
            }

            const min = tournament.min_team_size;
            const max = tournament.max_team_size;
            if (dto.members.length < min || dto.members.length > max) {
                throw new BadRequestException(`Team size must be between ${min} and ${max}`);
            }

            // Pre-validate email uniqueness within this tournament (the team_members
            // table has @Unique(['email', 'tournament'])). Without this check the
            // team_repo.save() succeeds but the members save throws ER_DUP_ENTRY,
            // leaving an orphaned team in the database.
            const seenEmails = new Set<string>();
            for (const m of dto.members) {
                const email = (m.email ?? '').trim().toLowerCase();
                if (!email) continue;
                if (seenEmails.has(email)) {
                    throw new ConflictException(`Учасник з email ${email} вказаний двічі`);
                }
                seenEmails.add(email);
                const existing = await this.memberRepo
                    .createQueryBuilder('tm')
                    .where('LOWER(tm.email) = :email', { email })
                    .andWhere('tm.tournament_id = :tid', { tid: dto.tournament_id })
                    .getOne();
                if (existing) {
                    throw new ConflictException(`Учасник з email ${email} вже бере участь у цьому турнірі`);
                }
            }
        }

        const team = this.teamRepo.create({
            ...dto,
            captain_id: captainId,
        });

        let saved: Team | null = null;
        try {
            saved = await this.teamRepo.save(team);

            // Save initial members. Members linked to a platform user start as 'pending';
            // placeholder members (no user_id) are 'accepted' so the captain's roster is complete.
            const savedMembers: TeamMember[] = [];
            if (dto.members && dto.members.length > 0) {
                const newMembers = dto.members.map((m) =>
                    this.memberRepo.create({
                        team: saved!,
                        tournament: tournament,
                        fullName: m.fullName ?? m.full_name ?? '',
                        email: m.email ?? '',
                        user_id: m.user_id ?? null,
                        status: m.user_id ? 'pending' : 'accepted',
                    }),
                );
                const persisted = await this.memberRepo.save(newMembers);
                savedMembers.push(...persisted);
            }

            // Create the team chat room itself (so it exists in chat_rooms),
            // then auto-join the captain. Invitees only join after accepting.
            const roomName = `team_${saved.id}`;
            const existingRoom = await this.chatRoomRepo.findOne({ where: { name: roomName } });
            if (!existingRoom) {
                await this.chatRoomRepo.save(
                    this.chatRoomRepo.create({
                        name: roomName,
                        label: saved.name,
                        created_by: captainId,
                    }),
                );
            }
            await this.chatRoomMemberRepo.save(
                this.chatRoomMemberRepo.create({
                    room: roomName,
                    user_id: captainId,
                    added_by: captainId,
                }),
            );

            // Send invite notifications to platform-linked members
            for (const m of savedMembers) {
                if (m.user_id && m.user_id !== captainId && m.status === 'pending') {
                    await this.sendInviteNotification(m.id, m.user_id, saved.name, tournament.name);
                }
            }

            return {
                id: saved.id,
                name: saved.name,
                tournament_id: saved.tournament_id,
                captain_id: saved.captain_id,
                created_at: saved.created_at,
            };
        } catch (error: any) {
            // Roll back the team if anything after the initial save failed —
            // otherwise an orphaned team row stays in the database.
            if (saved) {
                try {
                    await this.memberRepo.delete({ team: { id: saved.id } as any });
                    await this.chatRoomMemberRepo.delete({ room: `team_${saved.id}` });
                    await this.chatRoomRepo.delete({ name: `team_${saved.id}` });
                    await this.teamRepo.delete(saved.id);
                } catch { /* best-effort cleanup */ }
            }
            if (error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
                throw new ConflictException('Team registration conflict');
            }
            if (error instanceof ConflictException || error instanceof BadRequestException) throw error;
            throw new BadRequestException(error?.message || 'Failed to create team');
        }
    }

    async getTeamsByTournament(tournamentId: number) {
        const teams = await this.teamRepo.find({
            where: { tournament_id: tournamentId },
            relations: { members: true },
            order: { created_at: 'DESC' },
        });

        return teams.map((team) => ({
            id: team.id,
            name: team.name,
            members: team.members,
            city: team.city,
            school: team.school,
        }));
    }

    async getTeamById(id: number) {
        const team = await this.teamRepo.findOne({
            where: { id },
            relations: { members: true, tournament: true },
        });

        if (!team) throw new NotFoundException('Team not found');

        // Hydrate platform-linked members with user info (username, avatar, status, name)
        const linkedUserIds = (team.members || [])
            .map((m) => m.user_id)
            .filter((uid): uid is number => uid != null);

        const usersById = new Map<number, User>();
        if (linkedUserIds.length > 0) {
            const users = await this.userRepo
                .createQueryBuilder('u')
                .select(['u.id', 'u.username', 'u.user_avatar_url', 'u.status', 'u.first_name', 'u.last_name', 'u.middle_name'])
                .whereInIds(linkedUserIds)
                .getMany();
            for (const u of users) usersById.set(u.id, u);
        }

        return {
            ...team,
            tournament_name: team.tournament?.name ?? null,
            tournament_status: team.tournament?.status ?? null,
            tournament_start_date: team.tournament?.start_date ?? null,
            tournament_end_date: team.tournament?.end_date ?? null,
            tournament_registration_end: team.tournament?.registration_end ?? null,
            tournament_submission_start: team.tournament?.submission_start ?? null,
            tournament_submission_end: team.tournament?.submission_end ?? null,
            members: (team.members || []).map((m) => {
                const linked = m.user_id ? usersById.get(m.user_id) : null;
                return {
                    id: m.id,
                    full_name: m.fullName,
                    email: m.email,
                    user_id: m.user_id,
                    status: m.status,
                    username: linked?.username ?? null,
                    user_avatar_url: linked?.user_avatar_url ?? null,
                    presence: linked?.status ?? null,
                };
            }),
        };
    }

    async updateTeam(id: number, dto: any, user: any) {
        const team = await this.teamRepo.findOne({
            where: { id },
            relations: { tournament: true, members: true },
        });

        if (!team) throw new NotFoundException('Team not found');
        if (team.captain_id !== user.userId) {
            throw new ForbiddenException('Only captain can update team');
        }

        if (team.tournament.status === TournamentStatus.RUNNING || team.tournament.status === TournamentStatus.FINISHED) {
            throw new BadRequestException('Cannot update team after tournament start');
        }

        if (dto.name) team.name = dto.name;
        if (dto.city !== undefined) team.city = dto.city;
        if (dto.school !== undefined) team.school = dto.school;
        if (dto.organisation !== undefined) team.organisation = dto.organisation;
        if (dto.telegram_username !== undefined) team.telegram_username = dto.telegram_username;

        if (dto.members) {
            const min = team.tournament.min_team_size;
            const max = team.tournament.max_team_size;

            if (dto.members.length < min || dto.members.length > max) {
                throw new BadRequestException(`Team size must be between ${min} and ${max}`);
            }

            for (const m of dto.members) {
                if (m.user_id) {
                    const linkedUser = await this.userRepo.findOne({ where: { id: m.user_id } });
                    if (!linkedUser || !linkedUser.first_name || !linkedUser.last_name || !linkedUser.middle_name) {
                        const username = linkedUser?.username ?? `user#${m.user_id}`;
                        throw new BadRequestException(`Учасник ${username} ще не підтвердив своє ПІБ у профілі`);
                    }
                }
            }

            // Snapshot existing user_id → status so we don't re-invite users who already accepted/rejected.
            const existingStatusByUid = new Map<number, 'pending' | 'accepted' | 'rejected'>(
                (team.members || [])
                    .filter((m) => !!m.user_id)
                    .map((m) => [m.user_id as number, m.status]),
            );

            await this.memberRepo.delete({ team: { id: team.id } as any });

            const newMembers = dto.members.map((m: any) => {
                const uid: number | null = m.user_id ?? null;
                const prevStatus = uid ? existingStatusByUid.get(uid) : undefined;
                const status: 'pending' | 'accepted' | 'rejected' = uid
                    ? (prevStatus ?? 'pending')
                    : 'accepted';
                return this.memberRepo.create({
                    team,
                    tournament: team.tournament,
                    fullName: m.fullName ?? m.full_name ?? '',
                    email: m.email ?? '',
                    user_id: uid,
                    status,
                });
            });

            const savedMembers = await this.memberRepo.save(newMembers);

            // Send invites only to newly-added platform users (no prior record).
            const captainId = team.captain_id;
            for (const m of savedMembers) {
                if (
                    m.user_id &&
                    m.user_id !== captainId &&
                    m.status === 'pending' &&
                    !existingStatusByUid.has(m.user_id)
                ) {
                    await this.sendInviteNotification(m.id, m.user_id, team.name, team.tournament?.name ?? null);
                }
            }
        }

        await this.teamRepo.save(team);
        return { success: true };
    }

    async getMyPendingInvites(userId: number) {
        const invites = await this.memberRepo.find({
            where: { user_id: userId, status: 'pending' },
            relations: ['team', 'team.tournament'],
            order: { createdAt: 'DESC' },
        });
        return Promise.all(invites.map(async (m) => this.toInviteDto(m)));
    }

    async getInviteDetails(memberId: number, userId: number) {
        const invite = await this.memberRepo.findOne({
            where: { id: memberId },
            relations: ['team', 'team.tournament'],
        });
        if (!invite) throw new NotFoundException('Invite not found');
        if (invite.user_id !== userId) throw new ForbiddenException('Not your invite');
        return this.toInviteDto(invite);
    }

    async acceptInvite(memberId: number, userId: number) {
        const invite = await this.memberRepo.findOne({
            where: { id: memberId },
            relations: ['team'],
        });
        if (!invite) throw new NotFoundException('Invite not found');
        if (invite.user_id == null || invite.user_id !== userId) throw new ForbiddenException('Not your invite');
        if (invite.status !== 'pending') {
            throw new BadRequestException(`Invite already ${invite.status}`);
        }

        invite.status = 'accepted';
        await this.memberRepo.save(invite);

        const room = `team_${invite.team.id}`;
        const existing = await this.chatRoomMemberRepo.findOne({ where: { room, user_id: userId } });
        if (!existing) {
            await this.chatRoomMemberRepo.save(
                this.chatRoomMemberRepo.create({ room, user_id: userId, added_by: invite.team.captain_id }),
            );
        }

        const acceptingUser = await this.userRepo.findOne({ where: { id: userId } });
        const displayName = acceptingUser?.username ?? `user#${userId}`;
        const captainId = invite.team.captain_id;
        if (captainId != null && captainId !== userId) {
            await this.notificationsService.create({
                userId: captainId,
                message: `${displayName} приєднався(-лася) до команди "${invite.team.name}"`,
                icon: 'team_member_joined',
                link_tab: 'teams',
            });
        }

        return { success: true, team_id: invite.team.id };
    }

    async rejectInvite(memberId: number, userId: number) {
        const invite = await this.memberRepo.findOne({
            where: { id: memberId },
            relations: ['team'],
        });
        if (!invite) throw new NotFoundException('Invite not found');
        if (invite.user_id == null || invite.user_id !== userId) throw new ForbiddenException('Not your invite');
        if (invite.status !== 'pending') {
            throw new BadRequestException(`Invite already ${invite.status}`);
        }

        invite.status = 'rejected';
        await this.memberRepo.save(invite);

        const rejectingUser = await this.userRepo.findOne({ where: { id: userId } });
        const displayName = rejectingUser?.username ?? `user#${userId}`;
        const captainId = invite.team.captain_id;
        if (captainId != null && captainId !== userId) {
            await this.notificationsService.create({
                userId: captainId,
                message: `${displayName} відхилив(ла) запрошення в команду "${invite.team.name}"`,
                icon: 'team_invite_rejected',
                link_tab: 'teams',
            });
        }

        return { success: true };
    }

    private async toInviteDto(invite: TeamMember) {
        const captain = invite.team?.captain_id
            ? await this.userRepo.findOne({ where: { id: invite.team.captain_id } })
            : null;
        return {
            id: invite.id,
            status: invite.status,
            team: {
                id: invite.team?.id,
                name: invite.team?.name,
                city: invite.team?.city,
                school: invite.team?.school,
            },
            tournament: invite.team?.tournament
                ? {
                    id: invite.team.tournament.id,
                    name: invite.team.tournament.name,
                    status: invite.team.tournament.status,
                }
                : null,
            captain: captain
                ? {
                    id: captain.id,
                    username: captain.username,
                    avatar_url: captain.user_avatar_url ?? null,
                }
                : null,
            invited_at: invite.createdAt,
        };
    }

    async deleteTeam(id: number, user: any) {
        const team = await this.teamRepo.findOne({
            where: { id },
            relations: { tournament: true },
        });

        if (!team) throw new NotFoundException('Team not found');

        if (team.captain_id !== user.userId && user.role !== 'admin') {
            throw new ForbiddenException('No access');
        }

        // Clean up chat artefacts (no FK linkage from chat_rooms/messages to teams).
        const room = `team_${id}`;
        await this.chatRoomMemberRepo.delete({ room });
        await this.teamRepo.query('DELETE FROM messages WHERE room = ?', [room]);
        await this.chatRoomRepo.delete({ name: room });

        await this.teamRepo.remove(team);
        return { success: true };
    }

    async getTeamsCount(tournamentId: number) {
        return this.teamRepo.count({ where: { tournament_id: tournamentId } });
    }

    async upsertRepository(teamId: number, dto: UpsertTeamRepositoryDto, user: any) {
        const team = await this.assertTeamAccess(teamId, user, true);
        const verification = await this.fetchGithubRepository(dto.github_repo_url, dto.github_branch || 'main');

        let repo = await this.tournamentRepositoryRepo.findOne({ where: { team_id: teamId } });
        if (!repo) {
            repo = this.tournamentRepositoryRepo.create({
                team_id: teamId,
                tournament_id: team.tournament_id,
            });
        }

        Object.assign(repo, {
            github_repo_url: dto.github_repo_url,
            github_branch: dto.github_branch || 'main',
            github_commit_sha: verification.github_commit_sha,
            live_demo_url: dto.live_demo_url ?? null,
            pitch_video_url: dto.pitch_video_url ?? null,
            documentation_url: dto.documentation_url ?? null,
            repo_verified: verification.verified,
            last_verified_at: new Date(),
        });

        const saved = await this.tournamentRepositoryRepo.save(repo);
        return this.toRepositoryResponse(saved, verification.meta);
    }

    async getRepository(teamId: number, user: any) {
        await this.assertTeamAccess(teamId, user, false);
        const repo = await this.tournamentRepositoryRepo.findOne({ where: { team_id: teamId } });
        if (!repo) {
            throw new NotFoundException('Repository not found');
        }
        return this.toRepositoryResponse(repo);
    }

    async verifyRepository(teamId: number, user: any) {
        await this.assertTeamAccess(teamId, user, true);
        const repo = await this.tournamentRepositoryRepo.findOne({ where: { team_id: teamId } });
        if (!repo) {
            throw new NotFoundException('Repository not found');
        }

        const verification = await this.fetchGithubRepository(repo.github_repo_url, repo.github_branch);
        repo.repo_verified = verification.verified;
        repo.github_commit_sha = verification.github_commit_sha;
        repo.last_verified_at = new Date();
        const saved = await this.tournamentRepositoryRepo.save(repo);

        return this.toRepositoryResponse(saved, verification.meta);
    }

    async getRepositoryFiles(teamId: number, path: string, user: any) {
        await this.assertTeamAccess(teamId, user, false);
        const repo = await this.getRepositoryEntity(teamId);
        const parsed = this.parseGithubUrl(repo.github_repo_url);
        const content = await this.githubRequest(`/repos/${parsed.owner}/${parsed.repo}/contents/${path}?ref=${encodeURIComponent(repo.github_branch)}`);

        if (!Array.isArray(content)) {
            return [
                {
                    path: content.path,
                    type: content.type,
                    size: content.size,
                },
            ];
        }

        return content.map((item: any) => ({
            path: item.path,
            type: item.type,
            size: item.size ?? 0,
        }));
    }

    async getRepositoryFile(teamId: number, path: string, user: any) {
        if (!path) {
            throw new BadRequestException('path is required');
        }

        await this.assertTeamAccess(teamId, user, false);
        const repo = await this.getRepositoryEntity(teamId);
        const parsed = this.parseGithubUrl(repo.github_repo_url);
        const file = await this.githubRequest(`/repos/${parsed.owner}/${parsed.repo}/contents/${path}?ref=${encodeURIComponent(repo.github_branch)}`);

        if (Array.isArray(file) || file.type !== 'file') {
            throw new BadRequestException('Requested path is not a file');
        }

        return {
            path: file.path,
            content: file.encoding === 'base64' ? file.content : Buffer.from(String(file.content || ''), 'utf8').toString('base64'),
            language: this.inferLanguage(file.name || file.path),
        };
    }

    async createCodeComment(teamId: number, dto: CreateCodeCommentDto, user: any) {
        const team = await this.assertTeamAccess(teamId, user, false);
        const review = this.codeReviewRepo.create({
            team_id: teamId,
            tournament_id: team.tournament_id,
            reviewer_id: user.userId,
            file_path: dto.file_path,
            line_number: dto.line_number,
            comment: dto.comment,
        });

        const saved = await this.codeReviewRepo.save(review);
        return saved;
    }

    async getChatMembers(teamId: number, requestingUser: any) {
        const team = await this.teamRepo.findOne({ where: { id: teamId } });
        if (!team) throw new NotFoundException('Team not found');

        const role = String(requestingUser?.role || '');
        const isAdmin = role.includes('admin');
        const isCaptain = team.captain_id === requestingUser?.userId;
        const isChatMember = await this.chatRoomMemberRepo.findOne({
            where: { room: `team_${teamId}`, user_id: requestingUser?.userId },
        });

        if (!isAdmin && !isCaptain && !isChatMember) {
            throw new ForbiddenException('Access denied');
        }

        const members = await this.chatRoomMemberRepo.find({ where: { room: `team_${teamId}` } });
        const userIds = members.map((m) => m.user_id);
        if (!userIds.length) return [];

        const users = await this.userRepo
            .createQueryBuilder('u')
            .select(['u.id', 'u.username', 'u.first_name', 'u.last_name', 'u.middle_name', 'u.user_avatar_url', 'u.status', 'u.last_seen_at'])
            .whereInIds(userIds)
            .getMany();

        return users.map((u) => ({
            id: u.id,
            username: u.username,
            first_name: u.first_name,
            last_name: u.last_name,
            identity_confirmed: !!(u.first_name && u.last_name && u.middle_name),
            user_avatar_url: u.user_avatar_url ?? null,
            status: u.status ?? null,
            last_seen_at: u.last_seen_at ?? null,
            is_captain: u.id === team.captain_id,
        }));
    }

    async addChatMember(teamId: number, userId: number, requestingUser: any) {
        const team = await this.teamRepo.findOne({ where: { id: teamId }, relations: { members: true } });
        if (!team) throw new NotFoundException('Team not found');

        const role = String(requestingUser?.role || '');
        const isAdmin = role.includes('admin');
        const isCaptain = team.captain_id === requestingUser?.userId;
        if (!isAdmin && !isCaptain) throw new ForbiddenException('Only team captain or admin can add members');

        const isTeamMember =
            team.captain_id === userId ||
            team.members.some((m) => m.user_id === userId);
        if (!isTeamMember) {
            throw new BadRequestException('User is not a member of this team');
        }

        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');
        if (!user.first_name || !user.last_name || !user.middle_name) {
            throw new BadRequestException(`Учасник ${user.username} ще не підтвердив своє ПІБ у профілі`);
        }

        const existing = await this.chatRoomMemberRepo.findOne({
            where: { room: `team_${teamId}`, user_id: userId },
        });
        if (existing) return { message: 'Already a member' };

        const entry = this.chatRoomMemberRepo.create({
            room: `team_${teamId}`,
            user_id: userId,
            added_by: requestingUser?.userId ?? null,
        });
        await this.chatRoomMemberRepo.save(entry);
        return { success: true };
    }

    async removeChatMember(teamId: number, userId: number, requestingUser: any) {
        const team = await this.teamRepo.findOne({ where: { id: teamId } });
        if (!team) throw new NotFoundException('Team not found');

        const role = String(requestingUser?.role || '');
        const isAdmin = role.includes('admin');
        const isCaptain = team.captain_id === requestingUser?.userId;
        if (!isAdmin && !isCaptain) throw new ForbiddenException('Only team captain or admin can remove members');

        await this.chatRoomMemberRepo.delete({ room: `team_${teamId}`, user_id: userId });
        return { success: true };
    }

    async linkMemberToUser(teamId: number, memberId: number, userId: number, requestingUser: any) {
        const team = await this.teamRepo.findOne({ where: { id: teamId } });
        if (!team) throw new NotFoundException('Team not found');

        const role = String(requestingUser?.role || '');
        const isAdmin = role.includes('admin');
        const isCaptain = team.captain_id === requestingUser?.userId;
        if (!isAdmin && !isCaptain) throw new ForbiddenException('Only team captain or admin can link members');

        const member = await this.memberRepo.findOne({ where: { id: memberId, team: { id: teamId } as any } });
        if (!member) throw new NotFoundException('Team member not found');

        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');
        if (!user.first_name || !user.last_name || !user.middle_name) {
            throw new BadRequestException(`Учасник ${user.username} ще не підтвердив своє ПІБ у профілі`);
        }

        member.user_id = userId;
        await this.memberRepo.save(member);

        const existing = await this.chatRoomMemberRepo.findOne({
            where: { room: `team_${teamId}`, user_id: userId },
        });
        if (!existing) {
            await this.chatRoomMemberRepo.save(
                this.chatRoomMemberRepo.create({
                    room: `team_${teamId}`,
                    user_id: userId,
                    added_by: requestingUser?.userId ?? null,
                }),
            );
        }

        return { success: true };
    }

    async applyGithubWebhook(payload: any) {
        const repoFullName = payload?.repository?.full_name;
        const ref = payload?.ref;
        const commitSha = payload?.head_commit?.id ?? null;

        if (!repoFullName) {
            throw new BadRequestException('repository.full_name is required');
        }

        const repos = await this.tournamentRepositoryRepo.find();
        const matched = repos.filter((repo) => {
            const parsed = this.parseGithubUrl(repo.github_repo_url);
            return `${parsed.owner}/${parsed.repo}`.toLowerCase() === String(repoFullName).toLowerCase();
        });

        for (const repo of matched) {
            if (!ref || ref.endsWith(`/${repo.github_branch}`)) {
                repo.github_commit_sha = commitSha;
                repo.last_verified_at = new Date();
                if (commitSha) {
                    repo.repo_verified = true;
                }
                await this.tournamentRepositoryRepo.save(repo);
            }
        }

        return { success: true, affected: matched.length };
    }

    private async assertTeamAccess(teamId: number, user: any, write: boolean) {
        const team = await this.teamRepo.findOne({
            where: { id: teamId },
            relations: { tournament: true },
        });

        if (!team) {
            throw new NotFoundException('Team not found');
        }

        const role = String(user?.role || '');
        const isAdmin = role.includes('admin');
        const isCaptain = team.captain_id === user?.userId;
        const isMember = await this.memberRepo.findOne({
            where: { team: { id: teamId } as any, email: user?.email },
            relations: { team: true },
        });

        if (!isAdmin && !isCaptain && !isMember) {
            throw new ForbiddenException('No access to this team repository');
        }

        if (write && !isAdmin && !isCaptain) {
            throw new ForbiddenException('Only captain or admin can modify repository data');
        }

        return team;
    }

    private async getRepositoryEntity(teamId: number) {
        const repo = await this.tournamentRepositoryRepo.findOne({ where: { team_id: teamId } });
        if (!repo) {
            throw new NotFoundException('Repository not found');
        }
        return repo;
    }

    private parseGithubUrl(repoUrl: string) {
        const match = repoUrl.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+?)\/?$/i);
        if (!match) {
            throw new BadRequestException('Invalid GitHub repository URL');
        }

        return {
            owner: match[1],
            repo: match[2].replace(/\.git$/i, ''),
        };
    }

    private async fetchGithubRepository(repoUrl: string, branch: string) {
        const parsed = this.parseGithubUrl(repoUrl);
        const repoData = await this.githubRequest(`/repos/${parsed.owner}/${parsed.repo}`);

        let commitSha: string | null = null;
        try {
            const branchData = await this.githubRequest(`/repos/${parsed.owner}/${parsed.repo}/branches/${encodeURIComponent(branch)}`);
            commitSha = branchData?.commit?.sha ?? null;
        } catch {
            commitSha = null;
        }

        return {
            verified: true,
            github_commit_sha: commitSha,
            meta: {
                stars: repoData?.stargazers_count ?? 0,
                last_commit: repoData?.pushed_at ?? null,
                language: repoData?.language ?? null,
                default_branch: repoData?.default_branch ?? null,
            },
        };
    }

    private async githubRequest(path: string) {
        const githubToken = process.env.GITHUB_TOKEN || process.env.GITHUB_CLIENT_SECRET || '';
        const response = await fetch(`https://api.github.com${path}`, {
            headers: {
                Accept: 'application/vnd.github+json',
                ...(githubToken ? { Authorization: `token ${githubToken}` } : {}),
            },
        });

        if (!response.ok) {
            throw new BadRequestException(`GitHub API request failed: ${response.status}`);
        }

        return response.json();
    }

    private inferLanguage(path: string) {
        const ext = path.split('.').pop()?.toLowerCase() || '';
        const map: Record<string, string> = {
            js: 'javascript',
            ts: 'typescript',
            jsx: 'javascript',
            tsx: 'typescript',
            py: 'python',
            cs: 'csharp',
            java: 'java',
            cpp: 'cpp',
            c: 'c',
            go: 'go',
            rs: 'rust',
            php: 'php',
            html: 'html',
            css: 'css',
            json: 'json',
            md: 'markdown',
        };
        return map[ext] ?? 'text';
    }

    private toRepositoryResponse(repo: TournamentRepository, meta?: Record<string, any>) {
        return {
            id: repo.id,
            tournament_id: repo.tournament_id,
            team_id: repo.team_id,
            github_repo_url: repo.github_repo_url,
            github_branch: repo.github_branch,
            github_commit_sha: repo.github_commit_sha,
            live_demo_url: repo.live_demo_url,
            pitch_video_url: repo.pitch_video_url,
            documentation_url: repo.documentation_url,
            repo_verified: repo.repo_verified,
            last_verified_at: repo.last_verified_at,
            created_at: repo.created_at,
            updated_at: repo.updated_at,
            ...(meta ? { verification_meta: meta } : {}),
        };
    }
}
