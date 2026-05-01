import {Injectable} from "@nestjs/common";
import {PassportStrategy} from "@nestjs/passport";
import { ConfigService } from '@nestjs/config';
import { Strategy, Profile} from "passport-github2";
import {AuthService} from "../auth.service";
import {VerifyCallback} from "passport-google-oauth20";

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService,
    ) {
        super({
            clientID: configService.get<string>('GITHUB_CLIENT_ID')!,
            clientSecret: configService.get<string>('GITHUB_CLIENT_SECRET')!,
            callbackURL: configService.get<string>('GITHUB_CALLBACK_URL')!,
            scope: ['user:email'],
        });
    }

    async validate(
        accessToken: string,
        _refreshToken: string,
        profile: any,
        done: VerifyCallback,
    ): Promise<void> {
        const { id, username, displayName, photos, emails } = profile;

        const avatarUrl: string | undefined =
            photos?.[0]?.value ?? undefined;

        const email: string | undefined =
            emails?.[0]?.value ?? undefined;

        try {
            const result = await this.authService.oauthLogin({
                email,
                username: displayName || username || `github_${id}`,
                githubId: id,
                githubUsername: username ?? null,
                githubToken: accessToken,
                avatarUrl,
            });

            done(null, result);
        } catch (err) {
            done(err as Error, undefined);
        }
    }
}
