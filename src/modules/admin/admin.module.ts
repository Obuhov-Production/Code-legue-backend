import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { User } from '../users/entities/user.entity';
import { Tournament } from '../tournaments/entities/tournament.entity';
import { Team } from '../teams/entities/team.entity';
import { Submission } from '../submissions/entities/submission.entity';
import { ChatRoomSettings } from '../chat-room-settings/entities/chat-room-setting.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Tournament, Team, Submission, ChatRoomSettings]),
        AuthModule,
    ],
    controllers: [AdminController],
    providers: [AdminService],
})
export class AdminModule {}
