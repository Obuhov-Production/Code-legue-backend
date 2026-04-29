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

    async updateMe(userId: number, dto: {
        first_name?: string;
        last_name?: string;
        middle_name?: string;
        pinned_badge?: string;
        user_description?: string;
        banner_color?: string;
        banner_url?: string;
        user_avatar_url?: string;
    }): Promise<Omit<User, 'password'>> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');
        Object.assign(user, dto);
        const saved = await this.userRepository.save(user);
        const { password, ...userData } = saved as any;
        return userData;
    }

    async searchUsers(q: string) {
        if (!q || q.trim().length < 2) {
            return [];
        }

        const query = q.trim();

        const users = await this.userRepository
            .createQueryBuilder('user')
            .select([
                'user.id',
                'user.username',
                'user.email',
                'user.role',
                'user.user_description',
                'user.user_avatar_url',
                'user.banner_color',
                'user.banner_url',
                'user.created_at',
            ])
            .where('user.username LIKE :query', { query: `%${query}%` })
            .andWhere('user.role != :banned', { banned: 'banned' }) // краще ніж LIKE
            .limit(20)
            .getMany();

        return users;
    }

    async getPublicProfile(id: number) {
        const user = await this.userRepository
            .createQueryBuilder('user')
            .select([
                'user.id',
                'user.username',
                'user.role',
                'user.user_description',
                'user.user_avatar_url',
                'user.banner_color',
                'user.banner_url',
                'user.first_name',
                'user.last_name',
                'user.middle_name',
                'user.pinned_badge',
                'user.created_at',
            ])
            .where('user.id = :id', { id })
            .getOne();

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user;
    }

    async deleteBanner(userId: number) {
        const result = await this.userRepository.update(
            { id: userId },
            { banner_url: null },
        );

        if (result.affected === 0) {
            throw new NotFoundException('User not found');
        }

        return { message: 'Banner removed' };
    }
}
