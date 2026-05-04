import { Module } from '@nestjs/common';
import { ChatMessagesService } from './chat-messages.service';
import { ChatMessagesController } from './chat-messages.controller';
import { ChatLegacyController } from './chat-legacy.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entities/chat-message.entity';
import { ChatRoom } from '../chat-room/entities/chat-room.entity';
import { ChatGateway } from './chat.gateway';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
//import { UploadsModule } from '../../common/uploads/uploads.module';
import { ChatReactionsModule } from '../chat-reactions/chat-reactions.module';
import { ChatPinnedModule } from '../chat-pinned/chat-pinned.module';
import { UsersModule } from '../users/users.module';
import { ChatRoomMember } from '../teams/entities/chat-room-member.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, ChatRoom, ChatRoomMember]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '2h' },
      }),
    }),
      //    UploadsModule,
    ChatReactionsModule,
    ChatPinnedModule,
    UsersModule,
  ],
  controllers: [ChatMessagesController, ChatLegacyController],
  providers: [ChatMessagesService, ChatGateway],
  exports: [ChatGateway],
})
export class ChatMessagesModule {}
