import {Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards} from '@nestjs/common';
import type { Request } from 'express';
import { TeamsService } from './teams.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {CreateTeamDto} from "./dto/create-team.dto";
import {UpdateTeamDto} from "./dto/update-team.dto";
import { UpsertTeamRepositoryDto } from './dto/upsert-team-repository.dto';
import { CreateCodeCommentDto } from './dto/create-code-comment.dto';

@Controller('teams')
export class TeamsController {
    constructor(private readonly teamsService: TeamsService) {}

    @Get('my')
    @UseGuards(JwtAuthGuard)
    getMyTeams(@Req() req: Request) {
        return this.teamsService.findMyTeams((req.user as any).userId);
    }

    @UseGuards(JwtAuthGuard)
    @Post()
    async createTeam(@Body() dto: CreateTeamDto, @Req() req) {
        return this.teamsService.createTeam(dto, req.user);
    }

    @Get('tournament/:tournamentId')
    getTeamsByTournament(
        @Param('tournamentId', ParseIntPipe) tournamentId: number,
    ) {
        return this.teamsService.getTeamsByTournament(tournamentId);
    }

    @Get(':id')
    getOne(@Param('id', ParseIntPipe) id: number) {
        return this.teamsService.getTeamById(id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    updateTeam(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateTeamDto,
        @Req() req: Request,
    ) {
        return this.teamsService.updateTeam(id, dto, req.user);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    deleteTeam(
        @Param('id', ParseIntPipe) id: number,
        @Req() req: Request,
    ) {
        return this.teamsService.deleteTeam(id, req.user);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/repository')
    upsertRepository(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpsertTeamRepositoryDto,
        @Req() req: Request,
    ) {
        return this.teamsService.upsertRepository(id, dto, req.user as any);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id/repository')
    getRepository(
        @Param('id', ParseIntPipe) id: number,
        @Req() req: Request,
    ) {
        return this.teamsService.getRepository(id, req.user as any);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/repository/verify')
    verifyRepository(
        @Param('id', ParseIntPipe) id: number,
        @Req() req: Request,
    ) {
        return this.teamsService.verifyRepository(id, req.user as any);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id/code/files')
    getRepositoryFiles(
        @Param('id', ParseIntPipe) id: number,
        @Query('path') path: string,
        @Req() req: Request,
    ) {
        return this.teamsService.getRepositoryFiles(id, path || '', req.user as any);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id/code/file')
    getRepositoryFile(
        @Param('id', ParseIntPipe) id: number,
        @Query('path') path: string,
        @Req() req: Request,
    ) {
        return this.teamsService.getRepositoryFile(id, path, req.user as any);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/code/comment')
    createCodeComment(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: CreateCodeCommentDto,
        @Req() req: Request,
    ) {
        return this.teamsService.createCodeComment(id, dto, req.user as any);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':teamId/chat/members')
    getChatMembers(@Param('teamId', ParseIntPipe) teamId: number, @Req() req: Request) {
        return this.teamsService.getChatMembers(teamId, req.user as any);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':teamId/chat/members')
    addChatMember(
        @Param('teamId', ParseIntPipe) teamId: number,
        @Body() body: { user_id: number },
        @Req() req: Request,
    ) {
        return this.teamsService.addChatMember(teamId, body.user_id, req.user as any);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':teamId/chat/members/:userId')
    removeChatMember(
        @Param('teamId', ParseIntPipe) teamId: number,
        @Param('userId', ParseIntPipe) userId: number,
        @Req() req: Request,
    ) {
        return this.teamsService.removeChatMember(teamId, userId, req.user as any);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':teamId/members/:memberId/link')
    linkMember(
        @Param('teamId', ParseIntPipe) teamId: number,
        @Param('memberId', ParseIntPipe) memberId: number,
        @Body() body: { user_id: number },
        @Req() req: Request,
    ) {
        return this.teamsService.linkMemberToUser(teamId, memberId, body.user_id, req.user as any);
    }
}
