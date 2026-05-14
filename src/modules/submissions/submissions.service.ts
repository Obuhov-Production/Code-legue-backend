import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Submission } from './entities/submission.entity';
import { Round } from '../rounds/entities/round.entity';
import { Team } from '../teams/entities/team.entity';
import { JuryAssignment } from '../jury-assignments/entities/jury-assignment.entity';
import { TeamMember } from '../team-members/entities/team-member.entity';
import { RoundStatus } from '../rounds/enums/RoundStatus';
import { SubmissionStatus } from './enums/SubmissionStatus';
import { UpdateSubmissionDto } from './dto/update-submission.dto';

@Injectable()
export class SubmissionsService {
    constructor(
        @InjectRepository(Submission) private readonly submissionRepo: Repository<Submission>,
        @InjectRepository(Round) private readonly roundRepo: Repository<Round>,
        @InjectRepository(Team) private readonly teamRepo: Repository<Team>,
        @InjectRepository(JuryAssignment) private readonly juryAssignmentRepo: Repository<JuryAssignment>,
        @InjectRepository(TeamMember) private readonly teamMemberRepo: Repository<TeamMember>,
    ) {}

    /**
     * Daily submission counts for the last N days (UTC).
     * Returns: [{ date: 'YYYY-MM-DD', count: number, drafts: number, submitted: number }, ...]
     * Always returns N rows even for days with no submissions (zero-fill).
     * "When did a submission happen" = submitted_at if set, otherwise updated_at.
     */
    async getDailyStats(days: number) {
        const since = new Date();
        since.setUTCHours(0, 0, 0, 0);
        since.setUTCDate(since.getUTCDate() - (days - 1));

        const subs = await this.submissionRepo
            .createQueryBuilder('s')
            .select(['s.id', 's.status', 's.submitted_at', 's.updated_at'])
            .where('COALESCE(s.submitted_at, s.updated_at) >= :since', { since })
            .getMany();

        const buckets = new Map<string, { count: number; drafts: number; submitted: number }>();
        for (let i = 0; i < days; i++) {
            const d = new Date(since);
            d.setUTCDate(since.getUTCDate() + i);
            buckets.set(d.toISOString().slice(0, 10), { count: 0, drafts: 0, submitted: 0 });
        }

        for (const s of subs) {
            const when = (s.submitted_at ?? s.updated_at) as Date | null;
            if (!when) continue;
            const key = new Date(when).toISOString().slice(0, 10);
            const b = buckets.get(key);
            if (!b) continue;
            b.count += 1;
            if (String(s.status).toLowerCase() === 'draft') b.drafts += 1;
            else b.submitted += 1;
        }

        return Array.from(buckets.entries()).map(([date, v]) => ({ date, ...v }));
    }

    async getTeamSubmissions(teamId: number, user: any) {
        await this.assertTeamAccess(teamId, user);
        const submissions = await this.submissionRepo.find({
            where: { team_id: teamId },
            relations: { round: true },
            order: { updated_at: 'DESC' },
        });
        return submissions;
    }

    async getMyRoundSubmission(roundId: number, user: any) {
        const team = await this.findOwnedTeamForRound(roundId, user);
        const submission = await this.submissionRepo.findOne({
            where: { round_id: roundId, team_id: team.id },
        });
        return submission ?? null;
    }

    async createForRound(roundId: number, dto: CreateSubmissionDto, user: any) {
        const round = await this.getRoundOrThrow(roundId);
        this.ensureRoundAcceptsSubmission(round);
        const team = await this.findOwnedTeamForRound(roundId, user);

        const existing = await this.submissionRepo.findOne({
            where: { round_id: roundId, team_id: team.id },
        });

        if (existing) {
            throw new BadRequestException('Submission for this round already exists');
        }

        const submission = this.submissionRepo.create({
            round_id: roundId,
            team_id: team.id,
            github_repo_url: dto.github_repo_url,
            github_branch: dto.github_branch ?? 'main',
            pitch_video_url: dto.pitch_video_url,
            live_demo_url: dto.live_demo_url ?? null,
            description: dto.description ?? null,
            status: SubmissionStatus.SUBMITTED,
            submitted_at: new Date(),
        });

        return this.submissionRepo.save(submission);
    }

    async updateSubmission(id: number, dto: UpdateSubmissionDto, user: any) {
        const submission = await this.submissionRepo.findOne({
            where: { id },
            relations: { round: true, team: true },
        });

        if (!submission) {
            throw new NotFoundException('Submission not found');
        }

        await this.assertTeamAccess(submission.team_id, user);
        this.ensureSubmissionEditable(submission);

        Object.assign(submission, {
            github_repo_url: dto.github_repo_url ?? submission.github_repo_url,
            github_branch: dto.github_branch ?? submission.github_branch,
            pitch_video_url: dto.pitch_video_url ?? submission.pitch_video_url,
            live_demo_url: dto.live_demo_url ?? submission.live_demo_url,
            description: dto.description ?? submission.description,
        });

        return this.submissionRepo.save(submission);
    }

    async getAssignedRoundSubmissions(roundId: number, user: any) {
        const isAdmin = String(user?.role || '').includes('admin');

        if (isAdmin) {
            return this.submissionRepo.find({
                where: { round_id: roundId },
                relations: { team: true, evaluations: true },
                order: { updated_at: 'DESC' },
            });
        }

        const assignments = await this.juryAssignmentRepo.find({
            where: { jury_id: user.userId },
            relations: { submission: { team: true, evaluations: true } },
        });

        return assignments
            .map((assignment) => assignment.submission)
            .filter((submission) => submission?.round_id === roundId);
    }

    private async getRoundOrThrow(roundId: number) {
        const round = await this.roundRepo.findOne({ where: { id: roundId } });
        if (!round) {
            throw new NotFoundException('Round not found');
        }
        return round;
    }

    private ensureRoundAcceptsSubmission(round: Round) {
        if (round.status !== RoundStatus.ACTIVE) {
            throw new BadRequestException('Submission is allowed only for active rounds');
        }

        const deadline = new Date(round.end_date).getTime();

        if (Number.isNaN(deadline)) {
            throw new BadRequestException('Invalid round deadline');
        }

        if (deadline <= Date.now()) {
            throw new BadRequestException('Submission deadline has passed');
        }
    }

    private ensureSubmissionEditable(submission: Submission & { round: Round }) {
        if (submission.round.status !== RoundStatus.ACTIVE) {
            throw new BadRequestException('Submission is locked because round is not active');
        }

        const deadline = new Date(submission.round.end_date).getTime();

        if (Number.isNaN(deadline)) {
            throw new BadRequestException('Invalid round deadline');
        }

        if (deadline <= Date.now()) {
            throw new BadRequestException('Submission is locked because deadline has passed');
        }

        if (submission.status === SubmissionStatus.CLOSED) {
            throw new BadRequestException('Submission is closed');
        }
    }

    private async findOwnedTeamForRound(roundId: number, user: any) {
        const round = await this.roundRepo.findOne({ where: { id: roundId } });
        if (!round) {
            throw new NotFoundException('Round not found');
        }

        const team = await this.teamRepo.findOne({
            where: {
                tournament_id: round.tournament_id,
                captain_id: user.userId,
            },
        });

        if (team) {
            return team;
        }

        const membership = await this.teamMemberRepo.findOne({
            where: {
                tournament: { id: round.tournament_id } as any,
                email: user.email,
            },
            relations: { team: true },
        });

        if (!membership?.team) {
            throw new ForbiddenException('User does not belong to a team for this tournament');
        }

        return membership.team;
    }

    private async assertTeamAccess(teamId: number, user: any) {
        const team = await this.teamRepo.findOne({ where: { id: teamId } });
        if (!team) {
            throw new NotFoundException('Team not found');
        }

        const isAdmin = String(user?.role || '').includes('admin');
        if (isAdmin || team.captain_id === user.userId) {
            return team;
        }

        const membership = await this.teamMemberRepo.findOne({
            where: { team: { id: teamId } as any, email: user.email },
            relations: { team: true },
        });

        if (!membership) {
            throw new ForbiddenException('No access to team submissions');
        }

        return team;
    }
}
