import {Injectable, NotFoundException} from '@nestjs/common';
import {User} from "./entities/user.entity";
import {Repository} from "typeorm";
import {InjectRepository} from "@nestjs/typeorm";


@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User) private userRepository: Repository<User>, ) {}

    async getUserById(id: number): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { id },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    async getUserByEmail(email: string): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { email },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    async getAllUsers(): Promise<User[]> {
        return this.userRepository.find();
    }
}
