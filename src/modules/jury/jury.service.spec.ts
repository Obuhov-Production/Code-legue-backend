import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { JuryService } from './jury.service';

import { JuryAssignment } from '../jury-assignments/entities/jury-assignment.entity';
import { Tournament } from '../tournaments/entities/tournament.entity';
import { Submission } from '../submissions/entities/submission.entity';
import { Evaluation } from '../evaluation/entities/evaluation.entity';

describe('JuryService', () => {
    let service: JuryService;

    const mockJuryAssignmentRepo = {
        find: jest.fn(),
    };

    const mockTournamentRepo = {
        createQueryBuilder: jest.fn(),
    };

    const mockSubmissionRepo = {
        find: jest.fn(),
        manager: {
            getRepository: jest.fn(),
        },
    };

    const mockEvaluationRepo = {
        createQueryBuilder: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                JuryService,
                {
                    provide: getRepositoryToken(JuryAssignment),
                    useValue: mockJuryAssignmentRepo,
                },
                {
                    provide: getRepositoryToken(Tournament),
                    useValue: mockTournamentRepo,
                },
                {
                    provide: getRepositoryToken(Submission),
                    useValue: mockSubmissionRepo,
                },
                {
                    provide: getRepositoryToken(Evaluation),
                    useValue: mockEvaluationRepo,
                },
            ],
        }).compile();

        service = module.get<JuryService>(JuryService);

        jest.clearAllMocks();
    });

    describe('getSubmissionsForJury', () => {
        it('should return submissions for jury', async () => {
            const data = [{ id: 1 }];

            mockJuryAssignmentRepo.find.mockResolvedValue(data);

            expect(await service.getSubmissionsForJury(5)).toEqual(data);

            expect(mockJuryAssignmentRepo.find).toHaveBeenCalledWith({
                where: { jury_id: 5 },
                relations: {
                    submission: {
                        team: true,
                        round: true,
                        evaluations: true,
                    },
                },
            });
        });
    });

    describe('getRoundSubmissions', () => {
        it('should return submissions for admin', async () => {
            const submissions = [
                {
                    id: 1,
                    round_id: 2,
                    team_id: 3,
                    status: 'submitted',
                    team: {
                        name: 'Team Alpha',
                        city: 'Kyiv',
                        school: 'School',
                    },
                    evaluations: [],
                },
            ];

            mockSubmissionRepo.find.mockResolvedValue(submissions);

            const result = await service.getRoundSubmissions(2, {
                userId: 1,
                role: 'admin',
            });

            expect(result[0].team_name).toBe('Team Alpha');

            expect(mockSubmissionRepo.find).toHaveBeenCalled();
        });

        it('should return empty array when round not found', async () => {
            const mockRoundRepo = {
                findOne: jest.fn().mockResolvedValue(null),
            };

            mockSubmissionRepo.manager.getRepository.mockReturnValue(
                mockRoundRepo,
            );

            const result = await service.getRoundSubmissions(5, {
                userId: 2,
                role: 'jury',
            });

            expect(result).toEqual([]);
        });

        it('should return empty array when user is not jury', async () => {
            const mockRoundRepo = {
                findOne: jest.fn().mockResolvedValue({
                    id: 1,
                    tournament_id: 10,
                }),
            };

            mockSubmissionRepo.manager.getRepository.mockReturnValue(
                mockRoundRepo,
            );

            const qb = {
                innerJoin: jest.fn().mockReturnThis(),
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getCount: jest.fn().mockResolvedValue(0),
            };

            mockTournamentRepo.createQueryBuilder.mockReturnValue(qb);

            const result = await service.getRoundSubmissions(1, {
                userId: 5,
                role: 'jury',
            });

            expect(result).toEqual([]);
        });
    });
});