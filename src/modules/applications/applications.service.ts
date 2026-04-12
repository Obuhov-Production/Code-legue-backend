import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizerApplication } from './entities/organizer-application.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { ChatGateway } from '../chat-messages/chat.gateway';

@Injectable()
export class ApplicationsService {
    constructor(
        @InjectRepository(OrganizerApplication)
        private readonly appRepo: Repository<OrganizerApplication>,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        private readonly notificationsService: NotificationsService,
        private readonly chatGateway: ChatGateway,
    ) {}

    async submitOrganizer(userId: number, motivation: string) {
        const existing = await this.appRepo.findOne({ where: { userId } });
        if (existing && existing.status === 'pending') {
            throw new BadRequestException('Ви вже подали заявку. Очікуйте відповіді.');
        }
        if (existing && existing.status === 'approved') {
            throw new BadRequestException('Вашу заявку вже схвалено.');
        }

        const application = this.appRepo.create({ userId, motivation, status: 'pending' });
        return this.appRepo.save(application);
    }

    async getMyApplication(userId: number) {
        return this.appRepo.findOne({ where: { userId } });
    }

    async getAll() {
        const apps = await this.appRepo.find({
            order: { createdAt: 'DESC' },
            relations: ['user'],
        });
        return apps.map(({ user, ...app }) => ({
            ...app,
            username: user?.username ?? null,
            email: user?.email ?? null,
            user_avatar_url: user?.user_avatar_url ?? null,
        }));
    }

    async review(id: number, status: 'approved' | 'rejected', adminComment?: string) {
        const application = await this.appRepo.findOne({ where: { id }, relations: ['user'] });
        if (!application) throw new NotFoundException('Заявку не знайдено');

        application.status = status;
        application.adminComment = adminComment ?? null;
        await this.appRepo.save(application);

        if (status === 'approved') {
            const user = await this.userRepo.findOne({ where: { id: application.userId } });
            if (user) {
                const roles = user.role.split(',').map(r => r.trim()).filter(Boolean);
                if (!roles.includes('organizer')) {
                    roles.push('organizer');
                    user.role = roles.join(',');
                    await this.userRepo.save(user);
                }
            }
        }

        const message = status === 'approved'
            ? 'Вашу заявку на організатора схвалено!'
            : `Вашу заявку на організатора відхилено.${adminComment ? ' Причина: ' + adminComment : ''}`;

        const notification = await this.notificationsService.create({
            userId: application.userId,
            message,
            icon: status === 'approved' ? 'check-circle' : 'x-circle',
            link_tab: 'applications',
        });

        this.chatGateway.sendToUser(application.userId, 'notification:new', notification);

        return application;
    }
}
