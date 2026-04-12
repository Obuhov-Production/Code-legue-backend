import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-discord';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class DiscordStrategy extends PassportStrategy(Strategy, 'discord') {
    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService,
    ) {
        super({
            clientID: configService.get<string>('DISCORD_CLIENT_ID'),
            clientSecret: configService.get<string>('DISCORD_CLIENT_SECRET'),
            callbackURL: configService.get<string>('DISCORD_CALLBACK_URL'),
            scope: ['identify', 'email'],
        });
    }

    async validate(
        _accessToken: string,
        _refreshToken: string,
        profile: any,
        done: Function,
    ): Promise<void> {
        const { id, username, email, avatar } = profile;
        // animated avatars start with a_ — serve as .gif, others as .png
        const ext = avatar?.startsWith('a_') ? 'gif' : 'png';
        const avatarUrl = avatar
            ? `https://cdn.discordapp.com/avatars/${id}/${avatar}.${ext}?size=256`
            : undefined;
        try {
            const result = await this.authService.oauthLogin({
                email: email ?? undefined,
                username: username || `discord_${id}`,
                discordId: id,
                avatarUrl,
            });
            done(null, result);
        } catch (err) {
            done(err as Error, undefined);
        }
    }
}
