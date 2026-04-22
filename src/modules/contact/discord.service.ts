import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SendContactDto } from './dto/send-contact.dto';

interface DiscordField {
  name: string;
  value: string;
  inline?: boolean;
}

interface DiscordEmbed {
  title: string;
  color: number;
  fields: DiscordField[];
  footer: { text: string };
  timestamp: string;
}

@Injectable()
export class DiscordService {
  private readonly logger = new Logger(DiscordService.name);

  constructor(private readonly configService: ConfigService) {}

  async send(data: SendContactDto): Promise<void> {
    const webhookUrl = this.configService.get<string>('WEBHOOK_URL');

    if (!webhookUrl) {
      throw new InternalServerErrorException('WEBHOOK_URL is not configured');
    }

    const embed = this.buildEmbed(data);

    const payload = {
      username: 'Code League Contact',
      embeds: [embed],
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      this.logger.error(`Discord webhook failed: ${response.status} ${body}`);
      throw new InternalServerErrorException('Failed to send message to Discord');
    }
  }

  private buildEmbed(data: SendContactDto): DiscordEmbed {
    const timestamp = new Date().toISOString();

    if (data.type === 'join_team') {
      return {
        title: '🚀 Хтось хоче до нас у команду',
        color: 5814783,
        fields: [
          { name: "Ім'я",     value: data.name,            inline: true },
          { name: 'Email',    value: data.email,           inline: true },
          { name: 'Компанія', value: data.company  || '—', inline: true },
          { name: 'Бюджет',   value: data.budget   || '—', inline: true },
          { name: 'Рівень',   value: data.level    || '—' },
          { name: 'Про себе', value: data.details  || '—' },
        ],
        footer: { text: 'Code League · join form' },
        timestamp,
      };
    }

    return {
      title: '📩 Нове повідомлення',
      color: 7506394,
      fields: [
        { name: "Ім'я",  value: data.name,           inline: true },
        { name: 'Email', value: data.email,          inline: true },
        { name: 'Текст', value: data.message || '—' },
      ],
      footer: { text: 'Code League · contact form' },
      timestamp,
    };
  }
}
