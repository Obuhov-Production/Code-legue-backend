import { Module } from '@nestjs/common';
import { ChatMessagesService } from './chat-messages.service';
import { ChatMessagesController } from './chat-messages.controller';
import {TypeOrmModule} from "@nestjs/typeorm";
import {ChatPinned} from "../chat-pinned/entities/chat-pinned.entity";
import {Message} from "./entities/chat-message.entity";

@Module({
  imports: [TypeOrmModule.forFeature([ Message ])],
  controllers: [ChatMessagesController],
  providers: [ChatMessagesService],
})
export class ChatMessagesModule {}
