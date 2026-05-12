import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {ApplicationStatus, OrganizerApplication} from './entities/organizer-application.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { ChatGateway } from '../chat-messages/chat.gateway';
import {UserRole} from "../users/enums/UserRole.enum";

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

    async submitOrganizer(
        userId: number,
        motivation: string,
        experience?: string,
        contactEmail?: string,
        contactTelegram?: string,
        contactPhone?: string,
    ) {
        const existing = await this.appRepo.findOne({
            where: { userId },
        });

        if (existing) {
            if (existing.status === ApplicationStatus.PENDING) {
                throw new BadRequestException(
                    'Ви вже подали заявку. Очікуйте відповіді.',
                );
            }

            if (existing.status === ApplicationStatus.APPROVED) {
                throw new BadRequestException(
                    'Вашу заявку вже схвалено.',
                );
            }
        }

        const application = this.appRepo.create({
            userId,
            motivation,
            experience,
            contactEmail: contactEmail || null,
            contactTelegram: contactTelegram || null,
            contactPhone: contactPhone || null,
            status: ApplicationStatus.PENDING,
        } as Partial<OrganizerApplication>);

        const saved = await this.appRepo.save(application);

        const applicant = await this.userRepo.findOne({ where: { id: userId }, select: ['username'] });
        const adminNotifs = await this.notificationsService.notifyAdmins(
            `Нова заявка на організатора від ${applicant?.username ?? 'користувача'}`,
            '🗂️',
            'admin',
        );
        adminNotifs.forEach(n => {
            try { this.chatGateway.sendToUser(n.userId, 'notification:new', n); } catch {}
        });

        return saved;
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
            contact_email: app.contactEmail,
            contact_telegram: app.contactTelegram,
            contact_phone: app.contactPhone,
            created_at: app.createdAt,
        }));
    }

    async reviewOrganizer(
        id: number,
        status: ApplicationStatus,
    ) {
        const application = await this.appRepo.findOne({
            where: { id },
        });

        if (!application) {
            throw new NotFoundException('Заявку не знайдено');
        }

        if (application.status !== ApplicationStatus.PENDING) {
            throw new BadRequestException(
                'Цю заявку вже було оброблено',
            );
        }

        // ================= UPDATE =================
        application.status = status;

        await this.appRepo.save(application);

        // ================= APPROVED =================
        if (status === ApplicationStatus.APPROVED) {
            const user = await this.userRepo.findOne({
                where: { id: application.userId },
            });

            if (user) {
                const roles = (user.role ?? '')
                    .split(',')
                    .map(r => r.trim())
                    .filter(Boolean);

                if (!roles.includes(UserRole.ORGANIZER)) {
                    roles.push(UserRole.ORGANIZER);
                    user.role = roles.join(',');
                    await this.userRepo.save(user);
                }
            }
        }

        // ================= NOTIFICATION =================
        const message =
            status === ApplicationStatus.APPROVED
                ? 'Ваша заявка на організатора прийнята!'
                : 'Ваша заявка на організатора відхилена.';

        const notification = await this.notificationsService.create({
            userId: application.userId,
            message,
            icon:
                status === ApplicationStatus.APPROVED
                    ? '✅'
                    : '❌',
            link_tab: 'applications',
        });

        try {
            this.chatGateway.sendToUser(
                application.userId,
                'notification:new',
                notification,
            );
        } catch (e) {
            console.error('Socket error:', e);
        }

        return application;
    }
}
