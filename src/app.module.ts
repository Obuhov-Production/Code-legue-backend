import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { TournamentsModule } from './modules/tournaments/tournaments.module';
import { TeamsModule } from './modules/teams/teams.module';
import { TeamMembersModule } from './modules/team-members/team-members.module';
import {DatabaseModule} from "./database/database.module";



@Module({
  imports: [UsersModule, TournamentsModule,DatabaseModule, TeamsModule, TeamMembersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
