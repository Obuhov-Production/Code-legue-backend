import { Module } from '@nestjs/common';
import { JuryAssignmentsService } from './jury-assignments.service';
import { JuryAssignmentsController } from './jury-assignments.controller';
import {TypeOrmModule} from "@nestjs/typeorm";
import {User} from "../users/entities/user.entity";
import {Submission} from "../submissions/entities/submission.entity";
import {JuryAssignment} from "./entities/jury-assignment.entity";

@Module({
  imports: [TypeOrmModule.forFeature([ JuryAssignment ])],
  controllers: [JuryAssignmentsController],
  providers: [JuryAssignmentsService],
})
export class JuryAssignmentsModule {}
