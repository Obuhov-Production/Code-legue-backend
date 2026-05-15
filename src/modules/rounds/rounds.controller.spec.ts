import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';

import { RoundsController } from './rounds.controller';
import { RoundsService } from './rounds.service';

describe('RoundsController', () => {
    let controller: RoundsController;

    const mockRoundsService = {
        findByTournament: jest.fn(),
        create: jest.fn(),
        findOne: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
        uploadFile: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [RoundsController],
            providers: [
                {
                    provide: RoundsService,
                    useValue: mockRoundsService,
                },
            ],
        }).compile();

        controller = module.get<RoundsController>(RoundsController);

        jest.clearAllMocks();
    });

    describe('findByTournament', () => {
        it('should return rounds', async () => {
            const result = [{ id: 1 }];

            mockRoundsService.findByTournament.mockResolvedValue(result);

            expect(await controller.findByTournament('5')).toEqual(result);

            expect(mockRoundsService.findByTournament).toHaveBeenCalledWith(5);
        });
    });

    describe('create', () => {
        it('should create round', async () => {
            const dto = {
                title: 'Round 1',
            };

            const req = {
                user: {
                    userId: 1,
                },
            } as any;

            const result = {
                id: 1,
                title: 'Round 1',
            };

            mockRoundsService.create.mockResolvedValue(result);

            expect(
                await controller.create('10', dto as any, req),
            ).toEqual(result);

            expect(mockRoundsService.create).toHaveBeenCalledWith(
                10,
                dto,
                req.user,
            );
        });
    });

    describe('findOne', () => {
        it('should return round', async () => {
            const result = {
                id: 1,
            };

            mockRoundsService.findOne.mockResolvedValue(result);

            expect(await controller.findOne('1')).toEqual(result);

            expect(mockRoundsService.findOne).toHaveBeenCalledWith(1);
        });
    });

    describe('update', () => {
        it('should update round', async () => {
            const dto = {
                title: 'Updated',
            };

            const req = {
                user: {
                    userId: 2,
                },
            } as any;

            const result = {
                id: 1,
                title: 'Updated',
            };

            mockRoundsService.update.mockResolvedValue(result);

            expect(
                await controller.update('1', dto as any, req),
            ).toEqual(result);

            expect(mockRoundsService.update).toHaveBeenCalledWith(
                1,
                dto,
                req.user,
            );
        });
    });

    describe('remove', () => {
        it('should remove round', async () => {
            const req = {
                user: {
                    userId: 3,
                },
            } as any;

            const result = {
                success: true,
            };

            mockRoundsService.remove.mockResolvedValue(result);

            expect(await controller.remove('1', req)).toEqual(result);

            expect(mockRoundsService.remove).toHaveBeenCalledWith(
                1,
                req.user,
            );
        });
    });

    describe('uploadFile', () => {
        it('should upload rules file', async () => {
            const file = {
                originalname: 'rules.pdf',
                mimetype: 'application/pdf',
                buffer: Buffer.from('test'),
            } as Express.Multer.File;

            const req = {
                user: {
                    userId: 1,
                },
            } as any;

            const result = {
                success: true,
            };

            mockRoundsService.uploadFile.mockResolvedValue(result);

            expect(
                await controller.uploadFile(
                    '5',
                    'rules',
                    file,
                    req,
                ),
            ).toEqual(result);

            expect(mockRoundsService.uploadFile).toHaveBeenCalledWith(
                5,
                'rules',
                file,
                req.user,
            );
        });

        it('should fallback to misc type', async () => {
            const file = {
                originalname: 'file.txt',
                mimetype: 'text/plain',
                buffer: Buffer.from('test'),
            } as Express.Multer.File;

            const req = {
                user: {
                    userId: 1,
                },
            } as any;

            mockRoundsService.uploadFile.mockResolvedValue({
                success: true,
            });

            await controller.uploadFile(
                '1',
                'unknown',
                file,
                req,
            );

            expect(mockRoundsService.uploadFile).toHaveBeenCalledWith(
                1,
                'misc',
                file,
                req.user,
            );
        });

        it('should throw if file missing', async () => {
            await expect(
                controller.uploadFile(
                    '1',
                    'rules',
                    undefined as any,
                    {} as any,
                ),
            ).rejects.toThrow(BadRequestException);
        });
    });
});