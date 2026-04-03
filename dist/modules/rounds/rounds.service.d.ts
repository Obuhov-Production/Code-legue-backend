import { CreateRoundDto } from './dto/create-round.dto';
import { UpdateRoundDto } from './dto/update-round.dto';
export declare class RoundsService {
    create(createRoundDto: CreateRoundDto): string;
    findAll(): string;
    findOne(id: number): string;
    update(id: number, updateRoundDto: UpdateRoundDto): string;
    remove(id: number): string;
}
