import { Controller, Get, Post, Param, UploadedFile, UseGuards, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ChatMessagesService } from './chat-messages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadsService } from '../../common/uploads/uploads.service';

@Controller('chat')
export class ChatMessagesController {
    constructor(
        private readonly chatMessagesService: ChatMessagesService,
        private readonly uploadsService: UploadsService,
    ) {}

    @Get(':room')
    getHistory(@Param('room') room: string) {
        return this.chatMessagesService.findByRoom(room);
    }

    // alias для фронту: POST /api/chat/upload
    @Post('upload')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(
        FileInterceptor('file', {
            storage: memoryStorage(),
            limits: { fileSize: 10 * 1024 * 1024 },
        }),
    )
    async uploadFile(@UploadedFile() file: Express.Multer.File) {
        if (!file) throw new BadRequestException('Файл не знайдено');
        const url = await this.uploadsService.saveChatFile(file);
        return { url };
    }
}
