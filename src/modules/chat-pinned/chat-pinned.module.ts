import { Module } from '@nestjs/common';
import { ChatPinnedService } from './chat-pinned.service';
import { ChatPinnedController } from './chat-pinned.controller';
import {TypeOrmModule} from "@nestjs/typeorm";
import {ChatReaction} from "../chat-reactions/entities/chat-reaction.entity";
import {ChatPinned} from "./entities/chat-pinned.entity";

@Module({
  imports: [TypeOrmModule.forFeature([ ChatPinned ])],
  controllers: [ChatPinnedController],
  providers: [ChatPinnedService],
})
export class ChatPinnedModule {}
