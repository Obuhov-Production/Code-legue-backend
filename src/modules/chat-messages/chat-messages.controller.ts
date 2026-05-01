import {
    BadRequestException,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Query,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ChatMessagesService } from './chat-messages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import * as fs from 'fs';
import * as path from 'path';

@Controller('chat/messages')
export class ChatMessagesController {
    constructor(
        private readonly chatMessagesService: ChatMessagesService,
    ) {}

    @Get()
    getHistoryByQuery(@Query('room') room: string) {
        return this.chatMessagesService.findByRoom(room);
    }


    @Get(':room')
    getHistory(@Param('room') room: string) {
        return this.chatMessagesService.findByRoom(room);
    }

    @Post('upload')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(
        FileInterceptor('file', {
            storage: memoryStorage(),
            limits: { fileSize: 10 * 1024 * 1024 },
        }),
    )
    async uploadFile(@UploadedFile() file: Express.Multer.File) {
        if (!file) throw new BadRequestException('File not found');
        const targetDir = path.resolve(process.cwd(), 'uploads', 'chat');
        await fs.promises.mkdir(targetDir, { recursive: true });
        const ext = path.extname(file.originalname || '') || '.bin';
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
        await fs.promises.writeFile(path.join(targetDir, filename), file.buffer);
        return { url: `/uploads/chat/${filename}` };
    }

    @Delete(':room/clear')
    @UseGuards(JwtAuthGuard)
    clearRoom(@Param('room') room: string) {
        return this.chatMessagesService.clearRoom(room);
    }
}
