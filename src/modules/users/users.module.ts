import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import {TypeOrmModule} from "@nestjs/typeorm";
import {User} from "./entities/user.entity";
import {Team} from "../teams/entities/team.entity";
import {Tournament} from "../tournaments/entities/tournament.entity";
import {JuryAssignment} from "../jury-assignments/entities/jury-assignment.entity";

@Module({
  imports: [TypeOrmModule.forFeature([ User ] )],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
