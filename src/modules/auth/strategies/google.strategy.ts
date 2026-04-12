import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, StrategyOptions, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService,
    ) {
        super({
            clientID: configService.get<string>('GOOGLE_CLIENT_ID')!,
            clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET')!,
            callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL')!,
            scope: ['email', 'profile'],
        } as StrategyOptions);
    }

    async validate(
        _accessToken: string,
        _refreshToken: string,
        profile: any,
        done: VerifyCallback,
    ): Promise<void> {
        const { id, displayName, emails, photos } = profile;
        // беремо фото в максимальній якості — прибираємо =s96-c і ставимо =s256-c
        const rawPhoto: string | undefined = photos?.[0]?.value;
        const avatarUrl = rawPhoto
            ? rawPhoto.replace(/=s\d+-c$/, '=s256-c')
            : undefined;
        try {
            const result = await this.authService.oauthLogin({
                email: emails?.[0]?.value,
                username: displayName || `google_${id}`,
                googleId: id,
                avatarUrl,
            });
            done(null, result);
        } catch (err) {
            done(err as Error, undefined);
        }
    }
}
