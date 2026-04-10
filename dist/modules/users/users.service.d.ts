import { User } from "./entities/user.entity";
import { Repository } from "typeorm";
export declare class UsersService {
    private userRepository;
    constructor(userRepository: Repository<User>);
    getUserById(id: number): Promise<User>;
    getUserByEmail(email: string): Promise<User>;
    getAllUsers(): Promise<User[]>;
}
