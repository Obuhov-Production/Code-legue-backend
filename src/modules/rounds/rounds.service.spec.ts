import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import {
    BadRequestException,
    ForbiddenException,
    NotFoundException,
} from '@nestjs/common';

import { RoundsService } from './rounds.service';

import { Round } from './entities/round.entity';
import { Tournament } from '../tournaments/entities/tournament.entity';

import { RoundStatus } from './enums/RoundStatus';

describe('RoundsService', () => {
    let service: RoundsService;

    const mockRoundRepository = {
        create: jest.fn(),
        save: jest.fn(),
        find: jest.fn(),
        findOne: jest.fn(),
        remove: jest.fn(),
        createQueryBuilder: jest.fn(),
    };

    const mockTournamentRepository = {
        findOne: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RoundsService,
                {
                    provide: getRepositoryToken(Round),
                    useValue: mockRoundRepository,
                },
                {
                    provide: getRepositoryToken(Tournament),
                    useValue: mockTournamentRepository,
                },
            ],
        }).compile();

        service = module.get<RoundsService>(RoundsService);

        jest.clearAllMocks();
    });

    describe('findByTournament', () => {
        it('should return rounds', async () => {
            mockTournamentRepository.findOne.mockResolvedValue({
                id: 1,
            });

            mockRoundRepository.find.mockResolvedValue([
                {
                    id: 1,
                    title: 'Round 1',
                },
            ]);

            const result = await service.findByTournament(1);

            expect(result[0].id).toBe(1);

            expect(mockRoundRepository.find).toHaveBeenCalled();
        });

        it('should throw when tournament not found', async () => {
            mockTournamentRepository.findOne.mockResolvedValue(null);

            await expect(
                service.findByTournament(1),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('findOne', () => {
        it('should return round', async () => {
            mockRoundRepository.findOne.mockResolvedValue({
                id: 1,
                title: 'Round',
            });

            const result = await service.findOne(1);

            expect(result.id).toBe(1);
        });

        it('should throw when round not found', async () => {
            mockRoundRepository.findOne.mockResolvedValue(null);

            await expect(service.findOne(1)).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('remove', () => {
        it('should remove round', async () => {
            const round = {
                id: 1,
                tournament: {
                    created_by_id: 5,
                },
            };

            mockRoundRepository.findOne.mockResolvedValue(round);

            mockRoundRepository.remove.mockResolvedValue(undefined);

            const result = await service.remove(1, {
                userId: 5,
                role: '',
            });

            expect(result).toEqual({
                success: true,
            });

            expect(mockRoundRepository.remove).toHaveBeenCalledWith(
                round,
            );
        });

        it('should throw forbidden', async () => {
            mockRoundRepository.findOne.mockResolvedValue({
                id: 1,
                tournament: {
                    created_by_id: 99,
                },
            });

            await expect(
                service.remove(1, {
                    userId: 1,
                    role: '',
                }),
            ).rejects.toThrow(ForbiddenException);
        });
    });

    describe('validateDates', () => {
        it('should throw on invalid dates', () => {
            expect(() =>
                (service as any).validateDates(
                    'invalid',
                    '2026-01-01',
                ),
            ).toThrow(BadRequestException);
        });

        it('should throw when end before start', () => {
            expect(() =>
                (service as any).validateDates(
                    '2026-05-10',
                    '2026-05-01',
                ),
            ).toThrow(BadRequestException);
        });
    });

    describe('ensureNoOtherActiveRound', () => {
        it('should skip if status not active', async () => {
            await expect(
                (service as any).ensureNoOtherActiveRound(
                    1,
                    RoundStatus.DRAFT,
                ),
            ).resolves.toBeUndefined();
        });

        it('should throw if active round exists', async () => {
            const qb = {
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getOne: jest.fn().mockResolvedValue({
                    id: 1,
                }),
            };

            mockRoundRepository.createQueryBuilder.mockReturnValue(qb);

            await expect(
                (service as any).ensureNoOtherActiveRound(
                    1,
                    RoundStatus.ACTIVE,
                ),
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe('uploadFile', () => {
        it('should throw when round not found', async () => {
            mockRoundRepository.findOne.mockResolvedValue(null);

            await expect(
                service.uploadFile(
                    1,
                    'rules',
                    {} as any,
                    {},
                ),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw unsupported mime type', async () => {
            mockRoundRepository.findOne.mockResolvedValue({
                id: 1,
                tournament: {
                    created_by_id: 1,
                },
            });

            const file = {
                mimetype: 'application/exe',
            };

            await expect(
                service.uploadFile(
                    1,
                    'rules',
                    file as any,
                    {
                        userId: 1,
                    },
                ),
            ).rejects.toThrow(BadRequestException);
        });
    });
});