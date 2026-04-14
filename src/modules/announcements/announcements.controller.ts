import {Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe} from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';

@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}
  @Post()
  async create(
      @Body('tournament_id') tournament_id: number,
      @Body('title') title: string,
      @Body('message') message: string,
  ) {
    return this.announcementsService.create(
        tournament_id,
        title,
        message,
    );
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.announcementsService.remove(id);
  }

}
