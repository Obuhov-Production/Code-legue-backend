import { Body, Controller, Post } from '@nestjs/common';
import { TeamsService } from '../teams/teams.service';

@Controller('webhooks')
export class WebhooksController {
    constructor(private readonly teamsService: TeamsService) {}

    @Post('github')
    handleGithubWebhook(@Body() payload: any) {
        return this.teamsService.applyGithubWebhook(payload);
    }
}
