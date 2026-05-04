import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { TeamsModule } from '../teams/teams.module';

@Module({
    imports: [TeamsModule],
    controllers: [WebhooksController],
})
export class WebhooksModule {}
