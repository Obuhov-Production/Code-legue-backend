import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateRoundDto } from './dto/create-round.dto';
import { UpdateRoundDto } from './dto/update-round.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Round } from './entities/round.entity';
import { Tournament } from '../tournaments/entities/tournament.entity';
import { RoundStatus } from './enums/RoundStatus';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class RoundsService {
    constructor(
        @InjectRepository(Round)
        private readonly roundRepository: Repository<Round>,
        @InjectRepository(Tournament)
        private readonly tournamentRepository: Repository<Tournament>,
    ) {}

    async create(tournamentId: number, createRoundDto: CreateRoundDto, user: { userId?: number; role?: string }) {
        const tournament = await this.getTournamentOrThrow(tournamentId);
        this.assertTournamentAccess(tournament, user);
        this.validateDates(createRoundDto.starts_at, createRoundDto.deadline_at);
        await this.ensureNoOtherActiveRound(tournamentId, createRoundDto.status);

        const round = this.roundRepository.create({
            tournament_id: tournamentId,
            title: createRoundDto.title,
            description: createRoundDto.description ?? null,
            tech_requirements: createRoundDto.tech_requirements ?? null,
            must_have_items: createRoundDto.must_have_items ?? null,
            materials: createRoundDto.materials ?? null,
            start_date: new Date(createRoundDto.starts_at),
            end_date: new Date(createRoundDto.deadline_at),
            status: createRoundDto.status ?? RoundStatus.DRAFT,
            sort_order: createRoundDto.sort_order ?? 0,
            max_teams_pass: createRoundDto.max_teams_pass ?? null,
            rules_file_url: createRoundDto.rules_file_url ?? null,
            tz_file_url: createRoundDto.tz_file_url ?? null,
        });

        const saved = await this.roundRepository.save(round);
        return this.findOne(saved.id);
    }

    async findByTournament(tournamentId: number) {
        await this.getTournamentOrThrow(tournamentId);
        const rounds = await this.roundRepository.find({
            where: { tournament_id: tournamentId },
            order: { sort_order: 'ASC', start_date: 'ASC', id: 'ASC' },
        });
        return rounds.map((round) => this.toResponse(round));
    }

    async findOne(id: number) {
        const round = await this.roundRepository.findOne({
            where: { id },
            relations: { tournament: true },
        });

        if (!round) {
            throw new NotFoundException('Round not found');
        }

        return this.toResponse(round);
    }

    async update(id: number, updateRoundDto: UpdateRoundDto, user: { userId?: number; role?: string }) {
        const round = await this.roundRepository.findOne({
            where: { id },
            relations: { tournament: true },
        });

        if (!round) {
            throw new NotFoundException('Round not found');
        }

        this.assertTournamentAccess(round.tournament, user);

        const startsAt = updateRoundDto.starts_at ?? round.start_date.toISOString();
        const deadlineAt = updateRoundDto.deadline_at ?? round.end_date.toISOString();
        this.validateDates(startsAt, deadlineAt);

        if (updateRoundDto.status === RoundStatus.ACTIVE && round.status !== RoundStatus.ACTIVE) {
            await this.ensureNoOtherActiveRound(round.tournament_id, RoundStatus.ACTIVE, round.id);
        }

        Object.assign(round, {
            title: updateRoundDto.title ?? round.title,
            description: updateRoundDto.description ?? round.description,
            tech_requirements: updateRoundDto.tech_requirements ?? round.tech_requirements,
            must_have_items: updateRoundDto.must_have_items ?? round.must_have_items,
            materials: updateRoundDto.materials ?? round.materials,
            start_date: new Date(startsAt),
            end_date: new Date(deadlineAt),
            status: updateRoundDto.status ?? round.status,
            sort_order: updateRoundDto.sort_order ?? round.sort_order,
            max_teams_pass: updateRoundDto.max_teams_pass ?? round.max_teams_pass,
            rules_file_url: updateRoundDto.rules_file_url ?? round.rules_file_url,
            tz_file_url: updateRoundDto.tz_file_url ?? round.tz_file_url,
        });

        await this.roundRepository.save(round);
        return this.findOne(round.id);
    }

    async remove(id: number, user: { userId?: number; role?: string }) {
        const round = await this.roundRepository.findOne({
            where: { id },
            relations: { tournament: true },
        });

        if (!round) {
            throw new NotFoundException('Round not found');
        }

        this.assertTournamentAccess(round.tournament, user);
        await this.roundRepository.remove(round);
        return { success: true };
    }

    private async getTournamentOrThrow(tournamentId: number) {
        const tournament = await this.tournamentRepository.findOne({ where: { id: tournamentId } });
        if (!tournament) {
            throw new NotFoundException('Tournament not found');
        }

        return tournament;
    }

    private assertTournamentAccess(tournament: Tournament, user: { userId?: number; role?: string }) {
        const roles = (user?.role ?? '').split(',').map((item) => item.trim());
        const isAdmin = roles.includes('admin');
        const isOwner = tournament.created_by_id != null && tournament.created_by_id === user?.userId;

        if (!isAdmin && !isOwner) {
            throw new ForbiddenException('You do not have access to manage rounds for this tournament');
        }
    }

    private validateDates(startsAt: string, deadlineAt: string) {
        const startDate = new Date(startsAt);
        const endDate = new Date(deadlineAt);

        if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
            throw new BadRequestException('Invalid round date values');
        }

        if (endDate <= startDate) {
            throw new BadRequestException('Round deadline must be later than round start');
        }
    }

    private async ensureNoOtherActiveRound(tournamentId: number, status?: RoundStatus, excludeRoundId?: number) {
        if (status !== RoundStatus.ACTIVE) {
            return;
        }

        const query = this.roundRepository.createQueryBuilder('round')
            .where('round.tournament_id = :tournamentId', { tournamentId })
            .andWhere('round.status = :status', { status: RoundStatus.ACTIVE });

        if (excludeRoundId) {
            query.andWhere('round.id != :excludeRoundId', { excludeRoundId });
        }

        const existingActive = await query.getOne();
        if (existingActive) {
            throw new BadRequestException('Only one active round is allowed per tournament');
        }
    }

    async uploadFile(id: number, type: 'rules' | 'tz' | 'misc', file: Express.Multer.File, user: { userId?: number; role?: string }) {
        const round = await this.roundRepository.findOne({ where: { id }, relations: { tournament: true } });
        if (!round) throw new NotFoundException('Round not found');
        this.assertTournamentAccess(round.tournament, user);

        const allowedRules = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/markdown'];
        const allowedTz = ['application/pdf', 'application/zip', 'application/x-zip-compressed', 'text/plain', 'text/markdown', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg', 'image/gif'];
        const allowed = type === 'rules' ? allowedRules : allowedTz;
        if (!allowed.includes(file.mimetype)) {
            throw new BadRequestException(`Unsupported file type: ${file.mimetype}`);
        }

        const dir = path.resolve(process.cwd(), 'uploads', 'rounds', String(id), type);
        fs.mkdirSync(dir, { recursive: true });
        const ext = path.extname(file.originalname) || '.bin';
        const filename = `${Date.now()}${ext}`;
        const filePath = path.join(dir, filename);
        fs.writeFileSync(filePath, file.buffer);
        const url = `/uploads/rounds/${id}/${type}/${filename}`;

        // Save URL to round record
        if (type === 'rules') {
            round.rules_file_url = url;
        } else if (type === 'tz') {
            round.tz_file_url = url;
        }
        await this.roundRepository.save(round);

        return { success: true, url, type };
    }

    private toResponse(round: Round) {
        return {
            id: round.id,
            tournament_id: round.tournament_id,
            title: round.title,
            description: round.description,
            tech_requirements: round.tech_requirements,
            must_have_items: round.must_have_items ?? [],
            materials: round.materials ?? [],
            starts_at: round.start_date,
            deadline_at: round.end_date,
            status: round.status,
            sort_order: round.sort_order,
            max_teams_pass: round.max_teams_pass,
            rules_file_url: round.rules_file_url,
            tz_file_url: round.tz_file_url,
            created_at: round.created_at,
        };
    }
}
