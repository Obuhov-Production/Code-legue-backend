import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import {
    BadRequestException,
    ForbiddenException,
    NotFoundException,
} from '@nestjs/common';

import { SubmissionsService } from './submissions.service';

import { Submission } from './entities/submission.entity';
import { Round } from '../rounds/entities/round.entity';
import { Team } from '../teams/entities/team.entity';
import { JuryAssignment } from '../jury-assignments/entities/jury-assignment.entity';
import { TeamMember } from '../team-members/entities/team-member.entity';

describe('SubmissionsService', () => {
    let service: SubmissionsService;

    const repo = {
        create: jest.fn(),
        save: jest.fn(),
        find: jest.fn(),
        findOne: jest.fn(),
        createQueryBuilder: jest.fn(),
    };

    const roundRepo = { findOne: jest.fn() };
    const teamRepo = { findOne: jest.fn() };
    const juryRepo = { find: jest.fn() };
    const teamMemberRepo = { findOne: jest.fn() };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SubmissionsService,
                { provide: getRepositoryToken(Submission), useValue: repo },
                { provide: getRepositoryToken(Round), useValue: roundRepo },
                { provide: getRepositoryToken(Team), useValue: teamRepo },
                { provide: getRepositoryToken(JuryAssignment), useValue: juryRepo },
                { provide: getRepositoryToken(TeamMember), useValue: teamMemberRepo },
            ],
        }).compile();

        service = module.get(SubmissionsService);

        jest.clearAllMocks();
    });

    describe('getDailyStats', () => {
        it('should return zero-filled buckets', async () => {
            repo.createQueryBuilder.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue([]),
            });

            const result = await service.getDailyStats(3);

            expect(result.length).toBe(3);
            expect(result[0]).toHaveProperty('date');
        });
    });

    describe('getTeamSubmissions', () => {
        it('should return team submissions', async () => {
            teamRepo.findOne.mockResolvedValue({ id: 1 });

            teamMemberRepo.findOne.mockResolvedValue({
                team: { id: 1 },
            });

            repo.find.mockResolvedValue([{ id: 1 }]);

            const result = await service.getTeamSubmissions(1, {
                userId: 1,
            });

            expect(result).toEqual([{ id: 1 }]);
        });

        it('should throw if no access', async () => {
            teamRepo.findOne.mockResolvedValue(null);

            await expect(
                service.getTeamSubmissions(1, { userId: 1 }),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('getMyRoundSubmission', () => {
        it('should return null if no submission', async () => {
            roundRepo.findOne.mockResolvedValue({ id: 1, tournament_id: 10 });

            teamRepo.findOne.mockResolvedValue({ id: 2 });

            repo.findOne.mockResolvedValue(null);

            const result = await service.getMyRoundSubmission(1, {
                userId: 1,
            });

            expect(result).toBeNull();
        });
    });

    describe('createForRound', () => {
        it('should throw if already exists', async () => {
            roundRepo.findOne.mockResolvedValue({ id: 1, tournament_id: 2, status: 'ACTIVE', end_date: new Date(Date.now() + 100000) });

            jest.spyOn(service as any, 'findOwnedTeamForRound').mockResolvedValue({ id: 1 });

            repo.findOne.mockResolvedValue({ id: 1 });

            await expect(
                service.createForRound(1, {} as any, { userId: 1 }),
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe('updateSubmission', () => {
        it('should throw if not found', async () => {
            repo.findOne.mockResolvedValue(null);

            await expect(
                service.updateSubmission(1, {} as any, { userId: 1 }),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('assertTeamAccess', () => {
        it('should allow captain', async () => {
            teamRepo.findOne.mockResolvedValue({ id: 1, captain_id: 1 });

            const result = await (service as any).assertTeamAccess(1, {
                userId: 1,
                role: '',
            });

            expect(result.id).toBe(1);
        });

        it('should throw forbidden', async () => {
            teamRepo.findOne.mockResolvedValue({ id: 1, captain_id: 2 });

            teamMemberRepo.findOne.mockResolvedValue(null);

            await expect(
                (service as any).assertTeamAccess(1, {
                    userId: 1,
                    email: 'x@test.com',
                    role: '',
                }),
            ).rejects.toThrow(ForbiddenException);
        });
    });
});