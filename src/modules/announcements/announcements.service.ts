import {Injectable, NotFoundException} from '@nestjs/common';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import {Announcement} from "./entities/announcement.entity";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";

@Injectable()
export class AnnouncementsService {
    constructor(
        @InjectRepository(Announcement)
        private readonly announcementRepository: Repository<Announcement>,
    ) {}

    async create(
        tournament_id: number,
        title: string,
        message: string,
    ): Promise<Announcement> {
        const announcement = this.announcementRepository.create({
            tournament_id,
            title,
            message,
        });

        return await this.announcementRepository.save(announcement);
    }

    async remove(id: number): Promise<{ message: string }> {
        const announcement = await this.announcementRepository.findOne({
            where: { id },
        });

        if (!announcement) {
            throw new NotFoundException('Announcement not found');
        }

        await this.announcementRepository.remove(announcement);

        return { message: 'Announcement deleted successfully' };
    }
}
