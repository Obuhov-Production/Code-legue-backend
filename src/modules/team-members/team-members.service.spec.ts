import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import {
    ConflictException,
    ForbiddenException,
    NotFoundException,
} from '@nestjs/common';

import { TeamMembersService } from './team-members.service';
import { TeamMember } from './entities/team-member.entity';
import { Team } from '../teams/entities/team.entity';

describe('TeamMembersService', () => {
    let service: TeamMembersService;

    const memberRepo = {
        findOne: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
    };

    const teamRepo = {
        findOne: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TeamMembersService,
                { provide: getRepositoryToken(TeamMember), useValue: memberRepo },
                { provide: getRepositoryToken(Team), useValue: teamRepo },
            ],
        }).compile();

        service = module.get(TeamMembersService);

        jest.clearAllMocks();
    });

    describe('addMember', () => {
        const baseDto = {
            team_id: 1,
            fullName: 'John Doe',
            email: 'test@mail.com',
        };

        it('should throw if team not found', async () => {
            teamRepo.findOne.mockResolvedValue(null);

            await expect(
                service.addMember(baseDto as any, { userId: 1 }),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw if not captain', async () => {
            teamRepo.findOne.mockResolvedValue({
                id: 1,
                captain_id: 999,
                tournament: { id: 1, max_team_size: 5 },
            });

            await expect(
                service.addMember(baseDto as any, {
                    userId: 1,
                    email: 'a@mail.com',
                }),
            ).rejects.toThrow(ForbiddenException);
        });

        it('should throw if captain tries to add self', async () => {
            teamRepo.findOne.mockResolvedValue({
                id: 1,
                captain_id: 1,
                tournament: { id: 1, max_team_size: 5 },
            });

            memberRepo.findOne.mockResolvedValue(null);
            memberRepo.count.mockResolvedValue(1);

            await expect(
                service.addMember(baseDto as any, {
                    userId: 1,
                    email: 'test@mail.com',
                }),
            ).rejects.toThrow(ConflictException);
        });

        it('should throw if team is full', async () => {
            teamRepo.findOne.mockResolvedValue({
                id: 1,
                captain_id: 1,
                tournament: { id: 1, max_team_size: 2 },
            });

            memberRepo.findOne.mockResolvedValue(null);
            memberRepo.count.mockResolvedValue(2);

            await expect(
                service.addMember(baseDto as any, {
                    userId: 1,
                    email: 'other@mail.com',
                }),
            ).rejects.toThrow(ConflictException);
        });

        it('should add member successfully', async () => {
            teamRepo.findOne.mockResolvedValue({
                id: 1,
                captain_id: 1,
                tournament: { id: 1, max_team_size: 5 },
            });

            memberRepo.findOne.mockResolvedValue(null);
            memberRepo.count.mockResolvedValue(1);

            const saved = {
                id: 10,
                fullName: 'John Doe',
                email: 'test@mail.com',
                createdAt: new Date(),
            };

            memberRepo.create.mockReturnValue(saved);
            memberRepo.save.mockResolvedValue(saved);

            const result = await service.addMember(baseDto as any, {
                userId: 1,
                email: 'captain@mail.com',
            });

            expect(result).toEqual({
                id: 10,
                fullName: 'John Doe',
                email: 'test@mail.com',
                team_id: 1,
                tournament_id: 1,
                createdAt: saved.createdAt,
            });
        });
    });
});