import {MiddlewareConsumer, Module, NestModule, RequestMethod} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { TournamentsModule } from './modules/tournaments/tournaments.module';
import { TeamsModule } from './modules/teams/teams.module';
import { TeamMembersModule } from './modules/team-members/team-members.module';
import {DatabaseModule} from "./database/database.module";
import { TasksModule } from './modules/tasks/tasks.module';
import { SubmissionsModule } from './modules/submissions/submissions.module';
import { RoundsModule } from './modules/rounds/rounds.module';
import { JuryAssignmentsModule } from './modules/jury-assignments/jury-assignments.module';
import { EvaluationModule } from './modules/evaluation/evaluation.module';
import { EvaluationScoresModule } from './modules/evaluation-scores/evaluation-scores.module';
import { EvaluationCriteriaModule } from './modules/evaluation-criteria/evaluation-criteria.module';
import { ChatRoomModule } from './modules/chat-room/chat-room.module';
import { ChatRoomSettingsModule } from './modules/chat-room-settings/chat-room-settings.module';
import { ChatReactionsModule } from './modules/chat-reactions/chat-reactions.module';
import { ChatPinnedModule } from './modules/chat-pinned/chat-pinned.module';
import { ChatMessagesModule } from './modules/chat-messages/chat-messages.module';
import { AnnouncementsModule } from './modules/announcements/announcements.module';
import { AuthModule } from './modules/auth/auth.module';
import { SeedModule } from './common/seed/seed.module';
import { AdminModule } from './modules/admin/admin.module';
import { JuryModule } from './modules/jury/jury.module';
//import { UploadsModule } from './common/uploads/uploads.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { ApplicationsModule } from './modules/applications/applications.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { BadgesModule } from './modules/badges/badges.module';
import { AiModule } from './modules/ai/ai.module';
import { ContactModule } from './modules/contact/contact.module';
import { PublicModule } from './modules/public/public.module';
import {RefreshAccessTokenMiddleware} from "./middleware/refresh-token.middleware";
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { MailModule } from './modules/mail/mail.module';
import { EmailVerificationModule } from './modules/email-verification/email-verification.module';



@Module({
  imports: [UsersModule, TournamentsModule, DatabaseModule, TeamsModule, TeamMembersModule, TasksModule, SubmissionsModule, RoundsModule, JuryAssignmentsModule, EvaluationModule, EvaluationScoresModule, EvaluationCriteriaModule, ChatRoomModule, ChatRoomSettingsModule, ChatReactionsModule, ChatPinnedModule, ChatMessagesModule, AnnouncementsModule, AuthModule, SeedModule, AdminModule, JuryModule /* , UploadsModule */, ReviewsModule, ApplicationsModule, NotificationsModule, BadgesModule, AiModule, ContactModule, PublicModule, WebhooksModule, MailModule, EmailVerificationModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
        .apply(RefreshAccessTokenMiddleware)
        .forRoutes({path: '*', method: RequestMethod.ALL});
  }
}
