import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SendContactDto } from './dto/send-contact.dto';
import { DiscordService } from './discord.service';

type SenderFn = (data: SendContactDto) => Promise<void>;

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);
  private readonly senders: Record<string, SenderFn>;

  constructor(
    private readonly configService: ConfigService,
    private readonly discordService: DiscordService,
  ) {
    this.senders = {
      Discord: (data) => this.discordService.send(data),
      // Telegram: (data) => this.telegramService.send(data),   // розширити пізніше
      // Webhook:  (data) => this.webhookService.send(data),
    };
  }

  async handleContact(data: SendContactDto): Promise<void> {
    const method = this.configService.get<string>('CONTACT_METHOD') ?? 'Discord';
    const sender = this.senders[method];

    if (!sender) {
      this.logger.error(`Unknown CONTACT_METHOD: ${method}`);
      throw new InternalServerErrorException(`Unknown CONTACT_METHOD: ${method}`);
    }

    await sender(data);
  }
}
