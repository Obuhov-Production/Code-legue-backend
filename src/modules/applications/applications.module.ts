import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizerApplication } from './entities/organizer-application.entity';
import { ApplicationsService } from './applications.service';
import { ApplicationsController, AdminApplicationsController } from './applications.controller';
import { User } from '../users/entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { ChatMessagesModule } from '../chat-messages/chat-messages.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([OrganizerApplication, User]),
        NotificationsModule,
        ChatMessagesModule,
    ],
    controllers: [ApplicationsController, AdminApplicationsController],
    providers: [ApplicationsService],
})
export class ApplicationsModule {}
