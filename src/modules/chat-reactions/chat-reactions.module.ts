import { Module } from '@nestjs/common';
import { ChatReactionsService } from './chat-reactions.service';
import { ChatReactionsController } from './chat-reactions.controller';
import {TypeOrmModule} from "@nestjs/typeorm";
import {ChatRoom} from "../chat-room/entities/chat-room.entity";
import {ChatReaction} from "./entities/chat-reaction.entity";

@Module({
  imports: [TypeOrmModule.forFeature([ ChatReaction ])],
  controllers: [ChatReactionsController],
  providers: [ChatReactionsService],
})
export class ChatReactionsModule {}
