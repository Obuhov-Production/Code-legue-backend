import { UsersService } from './users.service';
import { User } from "./entities/user.entity";
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getMe(req: any): Promise<User>;
    getMeByEmail(req: any): Promise<User>;
    getAllUsers(): Promise<User[]>;
}
