import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Req, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Request } from 'express';
import { TournamentsService } from './tournaments.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from "./dto/update-tournament.dto";
import { TournamentStatus } from "./enums/TournamentStatus.enum";
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

const ALLOWED_RULES_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
];

const ALLOWED_TZ_TYPES = [
    'application/pdf',
    'application/zip',
    'application/x-zip-compressed',
    'text/plain',
    'text/markdown',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/png',
    'image/jpeg',
    'image/gif',
];

@Controller('tournaments')
export class TournamentsController {
    constructor(private readonly tournamentsService: TournamentsService) {}

    @Get()
    getAll(@Query('status') status?: TournamentStatus) {
        return this.tournamentsService.getAll(status);
    }

    @Get(':id')
    getById(@Param('id') id: string) {
        return this.tournamentsService.getById(Number(id));
    }

    @Get(':id/leaderboard')
    getLeaderboard(@Param('id') id: string) {
        return this.tournamentsService.getLeaderboard(Number(id));
    }

    @Get(':id/jury')
    getAssignedJury(@Param('id') id: string) {
        return this.tournamentsService.getAssignedJury(Number(id));
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    create(@Body() dto: CreateTournamentDto, @Req() req: Request) {
        const userId = (req.user as any)?.userId;
        return this.tournamentsService.create(dto, userId);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    update(@Param('id') id: string, @Body() dto: UpdateTournamentDto, @Req() req: Request) {
        return this.tournamentsService.update(Number(id), dto, req.user as any);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    delete(@Param('id') id: string, @Req() req: Request) {
        return this.tournamentsService.delete(Number(id), req.user as any);
    }

    @Patch(':id/status')
    @UseGuards(JwtAuthGuard)
    updateStatus(
        @Param('id') id: string,
        @Body('status') status: TournamentStatus,
        @Req() req: Request,
    ) {
        return this.tournamentsService.updateStatus(Number(id), status, req.user as any);
    }

    @Post(':id/upload-file')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('file', {
        storage: memoryStorage(),
        limits: { fileSize: 20 * 1024 * 1024 },
    }))
    async uploadFile(
        @Param('id') id: string,
        @Query('type') type: string,
        @UploadedFile() file: Express.Multer.File,
        @Req() req: Request,
    ) {
        if (!file) throw new BadRequestException('File is required');
        const fileType = (['rules', 'tz', 'misc'].includes(type) ? type : 'misc') as 'rules' | 'tz' | 'misc';

        const allowed = fileType === 'rules' ? ALLOWED_RULES_TYPES : ALLOWED_TZ_TYPES;
        if (!allowed.includes(file.mimetype)) {
            throw new BadRequestException(`Unsupported file type: ${file.mimetype}`);
        }

        return this.tournamentsService.uploadFile(Number(id), fileType, file, req.user as any);
    }
}
