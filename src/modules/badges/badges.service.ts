import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Badge } from './entities/badge.entity';

@Injectable()
export class BadgesService {
    constructor(
        @InjectRepository(Badge)
        private readonly badgeRepo: Repository<Badge>,
    ) {}

    async getMyBadges(userId: number): Promise<Badge[]> {
        return this.badgeRepo.find({ where: { userId }, order: { granted_at: 'DESC' } });
    }

    async getBadgesByUser(userId: number): Promise<Badge[]> {
        return this.badgeRepo.find({ where: { userId }, order: { granted_at: 'DESC' } });
    }

    async grantBadge(userId: number, dto: { name: string; icon_url?: string; description?: string }): Promise<Badge> {
        const badge = this.badgeRepo.create({ userId, ...dto });
        return this.badgeRepo.save(badge);
    }

    async deleteBadge(badgeId: number, userId: number): Promise<void> {
        const badge = await this.badgeRepo.findOne({ where: { id: badgeId, userId } });
        if (!badge) throw new NotFoundException('Badge not found');
        await this.badgeRepo.delete(badgeId);
    }
}
