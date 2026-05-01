import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { DeepPartial, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '../users/enums/UserRole.enum';
import { PlatformUserStatus } from '../users/dto/update-status.dto';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User) private authRepository: Repository<User>,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) {}

    private signTokens(payload: { userId: number; username: string; email: string; role: string }) {
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
        const now = new Date();

        const user = this.authRepository.create({
            email: dto.email,
            username: dto.username,
            password: hashedPassword,
            role: UserRole.USER,
            status: PlatformUserStatus.OFFLINE,
            last_seen_at: now,
            status_updated_at: now,
            github_connected: false,
            auth_provider: 'email',
        });

        const savedUser = await this.authRepository.save(user);
        const payload = { userId: savedUser.id, username: savedUser.username, email: savedUser.email, role: savedUser.role };
        const tokens = this.signTokens(payload);
        const { password, ...userData } = savedUser;

        return { user: userData, ...tokens };
    }

    async login(dto: LoginUserDto) {
        const user = await this.authRepository.findOne({
            where: { email: dto.email },
            select: ['id', 'username', 'email', 'password', 'role'],
        });

        if (!user) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const isPasswordValid = await bcrypt.compare(dto.password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const payload = { userId: user.id, username: user.username, email: user.email, role: user.role };
        const tokens = this.signTokens(payload);
        const { password, ...userData } = user;
        return { user: userData, ...tokens };
    }

    async oauthLogin(profile: {
        email?: string;
        username: string;
        googleId?: string;
        discordId?: string;
        avatarUrl?: string;
        githubId?: string;
        githubUsername?: string | null;
        githubToken?: string | null;
    }): Promise<{ token: string; accessToken: string; refreshToken: string; user: Omit<User, 'password'> }> {
        const {
            email,
            username,
            googleId,
            discordId,
            avatarUrl,
            githubId,
            githubUsername,
            githubToken,
        } = profile;

        let user: User | null = null;

        if (googleId) {
            user = await this.authRepository.findOne({ where: { googleId } });
        }
        if (!user && discordId) {
            user = await this.authRepository.findOne({ where: { discordId } });
        }
        if (!user && githubId) {
            user = await this.authRepository.findOne({ where: { githubId } });
        }
        if (!user && email) {
            user = await this.authRepository.findOne({ where: { email } });
        }

        if (user) {
            let changed = false;
            if (googleId && !user.googleId) { user.googleId = googleId; changed = true; }
            if (discordId && !user.discordId) { user.discordId = discordId; changed = true; }
            if (githubId && !user.githubId) { user.githubId = githubId; changed = true; }
            if (githubUsername) { user.github_username = githubUsername; changed = true; }
            if (githubToken) { user.github_token = githubToken; changed = true; }
            if (githubId) { user.github_connected = true; user.auth_provider = 'github'; changed = true; }
            if (googleId) { user.auth_provider = 'google'; changed = true; }
            if (avatarUrl) { user.user_avatar_url = avatarUrl; changed = true; }
            if (changed) {
                await this.authRepository.save(user);
            }
        } else {
            if (!email) {
                throw new BadRequestException('OAuth provider did not return email');
            }

            const randomPassword = await bcrypt.hash(Math.random().toString(36) + Date.now().toString(), 12);
            const uniqueUsername = await this.buildUniqueUsername(username);
            const now = new Date();
            const partial: DeepPartial<User> = {
                email,
                username: uniqueUsername,
                password: randomPassword,
                role: UserRole.USER,
                status: PlatformUserStatus.OFFLINE,
                last_seen_at: now,
                status_updated_at: now,
                github_username: githubUsername ?? null,
                github_token: githubToken ?? null,
                github_connected: !!githubId,
                auth_provider: githubId ? 'github' : googleId ? 'google' : 'email',
                googleId: googleId ?? undefined,
                discordId: discordId ?? undefined,
                githubId: githubId ?? undefined,
                user_avatar_url: avatarUrl ?? undefined,
            };
            user = await this.authRepository.save(this.authRepository.create(partial));
        }

        const payload = { userId: user.id, username: user.username, email: user.email, role: user.role };
        const tokens = this.signTokens(payload);
        const { password, ...userData } = user;
        return { ...tokens, user: userData };
    }

    async getMe(userId: number) {
        const user = await this.authRepository.findOne({ where: { id: userId } });
        if (!user) throw new UnauthorizedException('Session expired, please sign in again');
        const { password, ...userData } = user;
        return userData;
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
    }) {
        const user = await this.authRepository.findOne({ where: { id: userId } });
        if (!user) throw new UnauthorizedException('Session expired, please sign in again');
        Object.assign(user, dto);
        const saved = await this.authRepository.save(user);
        const { password, ...userData } = saved;
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

    async refresh(refreshToken: string) {
        try {
            const payload = await this.jwtService.verifyAsync(refreshToken);
            const newAccessToken = this.jwtService.sign(
                { userId: payload.userId, username: payload.username, email: payload.email, role: payload.role },
                { expiresIn: '2h' },
            );
            return { accessToken: newAccessToken };
        } catch {
            throw new UnauthorizedException('Invalid or expired token');
        }
    }

    verifyAccessToken(token: string) {
        return this.jwtService.verify(token);
    }

    async touchUserActivity(userId: number) {
        await this.authRepository.update(
            { id: userId },
            { last_seen_at: new Date() },
        );
    }
}
