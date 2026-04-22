import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';
import { DiscordService } from './discord.service';

@Module({
  imports: [
    ConfigModule,
    ThrottlerModule.forRoot([{ ttl: 600000, limit: 3 }]),
  ],
  controllers: [ContactController],
  providers: [ContactService, DiscordService],
})
export class ContactModule {}
