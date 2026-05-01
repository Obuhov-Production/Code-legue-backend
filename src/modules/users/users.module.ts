import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import {TypeOrmModule} from "@nestjs/typeorm";
import {User} from "./entities/user.entity";
import { Badge } from '../badges/entities/badge.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Badge])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
