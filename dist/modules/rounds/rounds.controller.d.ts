import { RoundsService } from './rounds.service';
import { CreateRoundDto } from './dto/create-round.dto';
import { UpdateRoundDto } from './dto/update-round.dto';
export declare class RoundsController {
    private readonly roundsService;
    constructor(roundsService: RoundsService);
    create(createRoundDto: CreateRoundDto): string;
    findAll(): string;
    findOne(id: string): string;
    update(id: string, updateRoundDto: UpdateRoundDto): string;
    remove(id: string): string;
}
