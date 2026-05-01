import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectRepository(Notification)
        private readonly repo: Repository<Notification>,
    ) {}

    async create(data: { userId: number; message: string; icon?: string; link_tab?: string }): Promise<Notification> {
        const n = this.repo.create({
            userId: data.userId,
            message: data.message,
            icon: data.icon ?? null,
            link_tab: data.link_tab ?? null,
            is_read: false,
        });
        return this.repo.save(n);
    }

    async findForUser(userId: number): Promise<Notification[]> {
        return this.repo.find({
            where: { userId },
            order: { created_at: 'DESC' },
            take: 50,
        });
    }

    async markRead(id: number, userId: number): Promise<void> {
        await this.repo.update({ id, userId }, { is_read: true });
    }

    async markAllRead(userId: number): Promise<void> {
        await this.repo.update({ userId, is_read: false }, { is_read: true });
    }

    async remove(id: number, userId: number): Promise<void> {
        await this.repo.delete({ id, userId });
    }
}
