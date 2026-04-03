import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { JuryAssignmentsService } from './jury-assignments.service';
import { CreateJuryAssignmentDto } from './dto/create-jury-assignment.dto';

@Controller('jury-assignments')
export class JuryAssignmentsController {
  constructor(private readonly juryAssignmentsService: JuryAssignmentsService) {}

}
