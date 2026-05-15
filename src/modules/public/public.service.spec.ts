import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';

import { PublicService } from './public.service';

import { Tournament } from '../tournaments/entities/tournament.entity';
import { Team } from '../teams/entities/team.entity';

import { TournamentStatus } from '../tournaments/enums/TournamentStatus.enum';

describe('PublicService', () => {
    let service: PublicService;

    const mockTournamentRepo = {
        find: jest.fn(),
        findOne: jest.fn(),
    };

    const mockTeamRepo = {
        find: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PublicService,
                {
                    provide: getRepositoryToken(Tournament),
                    useValue: mockTournamentRepo,
                },
                {
                    provide: getRepositoryToken(Team),
                    useValue: mockTeamRepo,
                },
            ],
        }).compile();

        service = module.get<PublicService>(PublicService);

        jest.clearAllMocks();
    });

    describe('getTournaments', () => {
        it('should return mapped tournaments', async () => {
            const tournaments = [
                {
                    id: 1,
                    name: 'Code League',
                    description: 'Tournament',
                    status: TournamentStatus.RUNNING,
                    category: 'IT',
                    emoji: '🔥',
                    format: 'online',
                    prize: '1000$',
                    tz_enabled: true,
                    tz: 'UTC+2',
                    rounds_count: 3,
                    min_team_size: 1,
                    max_team_size: 5,
                    elo_participation: 10,
                    elo_per_round: 20,
                    elo_winner: 100,
                    start_date: new Date(),
                    end_date: new Date(),
                    registration_start: new Date(),
                    registration_end: new Date(),
                    teams_limit: 20,
                    teams: [{ id: 1 }, { id: 2 }],
                },
            ];

            mockTournamentRepo.find.mockResolvedValue(tournaments);

            const result = await service.getTournaments();

            expect(result[0]).toMatchObject({
                id: 1,
                name: 'Code League',
                teams_count: 2,
            });

            expect(mockTournamentRepo.find).toHaveBeenCalled();
        });
    });

    describe('getLeaderboard', () => {
        it('should throw when tournament not found', async () => {
            mockTournamentRepo.findOne.mockResolvedValue(null);

            await expect(
                service.getLeaderboard(99),
            ).rejects.toThrow(NotFoundException);
        });

        it('should return leaderboard sorted by score', async () => {
            mockTournamentRepo.findOne.mockResolvedValue({
                id: 1,
            });

            mockTeamRepo.find.mockResolvedValue([
                {
                    id: 1,
                    name: 'Alpha',
                    city: 'Kyiv',
                    school: 'School A',
                    organisation: 'Org A',
                    submissions: [
                        {
                            evaluations: [
                                {
                                    total_score: 50,
                                    criteria: {
                                        design: 20,
                                        logic: 30,
                                    },
                                },
                            ],
                        },
                    ],
                },
                {
                    id: 2,
                    name: 'Beta',
                    city: 'Lviv',
                    school: 'School B',
                    organisation: 'Org B',
                    submissions: [
                        {
                            evaluations: [
                                {
                                    total_score: 80,
                                    criteria: JSON.stringify({
                                        ui: 40,
                                        backend: 40,
                                    }),
                                },
                            ],
                        },
                    ],
                },
            ]);

            const result = await service.getLeaderboard(1);

            expect(result[0].team_name).toBe('Beta');
            expect(result[0].rank).toBe(1);
            expect(result[0].total_score).toBe(80);

            expect(result[1].team_name).toBe('Alpha');
            expect(result[1].rank).toBe(2);
            expect(result[1].total_score).toBe(50);
        });
    });

    describe('normalizeCriteria', () => {
        it('should normalize array criteria', () => {
            const result = (service as any).normalizeCriteria([
                {
                    label: 'UI',
                    score: 20,
                },
            ]);

            expect(result).toEqual([
                {
                    label: 'UI',
                    score: 20,
                },
            ]);
        });

        it('should normalize object criteria', () => {
            const result = (service as any).normalizeCriteria({
                backend: 40,
            });

            expect(result).toEqual([
                {
                    label: 'backend',
                    score: 40,
                },
            ]);
        });

        it('should return empty array for invalid json', () => {
            const result = (service as any).normalizeCriteria('{invalid');

            expect(result).toEqual([]);
        });
    });

    describe('normalizeCriterionItem', () => {
        it('should return null for invalid score', () => {
            const result = (service as any).normalizeCriterionItem(
                'test',
                'abc',
            );

            expect(result).toBeNull();
        });

        it('should normalize object item', () => {
            const result = (service as any).normalizeCriterionItem(
                'design',
                {
                    label: 'Design',
                    score: 25,
                },
            );

            expect(result).toEqual({
                label: 'Design',
                score: 25,
            });
        });
    });
});