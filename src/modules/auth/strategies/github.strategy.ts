import {Injectable} from "@nestjs/common";
import {PassportStrategy} from "@nestjs/passport";
import { ConfigService } from '@nestjs/config';
import { Strategy, Profile} from "passport-github2";

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
    constructor(
        private readonly configService: ConfigService,
    ) {
        super({
            clientID: configService.getOrThrow<string>('GITHUB_CLIENT_ID'),
            clientSecret: configService.getOrThrow<string>('GITHUB_CLIENT_SECRET'),
            callbackURL: configService.getOrThrow<string>('GITHUB_CALLBACK_URL'),
            scope: ['user:email'],
        });
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: Profile,
    ) {
        return {
            githubId: profile.id,
            username: profile.username,
            email: profile.emails?.[0]?.value,
            avatar: profile.photos?.[0]?.value,
        };
    }
}