import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from './entities/team.entity';

@Injectable()
export class TeamsService {
    constructor(
        @InjectRepository(Team) private readonly teamRepo: Repository<Team>,
    ) {}

    async findMyTeams(userId: number): Promise<Team[]> {
        return this.teamRepo.find({
            where: { captain_id: userId },
            relations: ['tournament'],
        });
    }
}
