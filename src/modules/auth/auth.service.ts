import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { DeepPartial, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User) private authRepository: Repository<User>,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) {}

    private signTokens(payload: { userId: number; username: string; email: string }) {
        const accessToken = this.jwtService.sign(payload, {
            secret: this.configService.get<string>('JWT_SECRET'),
            expiresIn: '2h',
        });
        const refreshToken = this.jwtService.sign(payload, {
            secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            expiresIn: '7d',
        });
        return { token: accessToken, accessToken, refreshToken };
    }

    async create(dto: CreateUserDto) {
        const existingUser = await this.authRepository.findOne({
            where: { email: dto.email },
        });

        if (existingUser) {
            throw new BadRequestException('Email already exists');
        }

        const hashedPassword = await bcrypt.hash(dto.password, 10);

        const user = this.authRepository.create({
            email: dto.email,
            username: dto.username,
            password: hashedPassword,
        });

        const savedUser = await this.authRepository.save(user);
        const payload = { userId: savedUser.id, username: savedUser.username, email: savedUser.email };
        const tokens = this.signTokens(payload);
        const { password, ...userData } = savedUser;

        return { user: userData, ...tokens };
    }

    async login(dto: LoginUserDto) {
        const user = await this.authRepository.findOne({
            where: { email: dto.email },
            select: ['id', 'username', 'email', 'password'],
        });

        if (!user) {
            throw new UnauthorizedException('Невірна пошта або пароль');
        }

        const isPasswordValid = await bcrypt.compare(dto.password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Невірна пошта або пароль');
        }

        const payload = { userId: user.id, username: user.username, email: user.email };
        const tokens = this.signTokens(payload);
        const { password, ...userData } = user;
        return { user: userData, ...tokens };
    }

    async oauthLogin(profile: {
        email: string;
        username: string;
        googleId?: string;
        discordId?: string;
        avatarUrl?: string;
    }): Promise<{ token: string; accessToken: string; refreshToken: string }> {
        const { email, username, googleId, discordId, avatarUrl } = profile;

        if (!email) {
            throw new BadRequestException('OAuth provider did not return an email');
        }

        let user = await this.authRepository.findOne({ where: { email } });

        if (!user) {
            const hashedPassword = await bcrypt.hash(Math.random().toString(36) + Date.now(), 10);
            const uniqueUsername = await this.buildUniqueUsername(username);
            const partial: DeepPartial<User> = {
                email,
                username: uniqueUsername,
                password: hashedPassword,
                googleId: googleId ?? undefined,
                discordId: discordId ?? undefined,
                user_avatar_url: avatarUrl ?? undefined,
            };
            const newUser = this.authRepository.create(partial);
            user = await this.authRepository.save(newUser);
        } else {
            let changed = false;
            if (googleId && !user.googleId) { user.googleId = googleId; changed = true; }
            if (discordId && !user.discordId) { user.discordId = discordId; changed = true; }
            if (changed) await this.authRepository.save(user);
        }

        const payload = { userId: user!.id, username: user!.username, email: user!.email };
        return this.signTokens(payload);
    }

    async getMe(userId: number) {
        const user = await this.authRepository.findOne({ where: { id: userId } });
        if (!user) throw new UnauthorizedException('Сесія закінчилась, увійдіть знову');
        const { password, ...userData } = user;
        return userData;
    }

    private async buildUniqueUsername(base: string): Promise<string> {
        const clean = base.replace(/\s+/g, '_').toLowerCase().slice(0, 30);
        let name = clean;
        let count = 1;
        while (await this.authRepository.findOne({ where: { username: name } })) {
            name = `${clean}_${count++}`;
        }
        return name;
    }
}
