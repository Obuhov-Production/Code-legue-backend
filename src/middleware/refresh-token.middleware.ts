import {Injectable, NestMiddleware, UnauthorizedException} from "@nestjs/common";
import {AuthService} from "../modules/auth/auth.service";
import {NextFunction} from "express";
import type { Request, Response } from 'express';

@Injectable()
export class RefreshAccessTokenMiddleware implements NestMiddleware {
    constructor(private readonly authService: AuthService) {}

    async use(req: Request, res: Response, next: NextFunction) {
        const authHeader = req.headers['authorization'];
        const accessToken = authHeader?.split(' ')[1];
        const rawRefreshToken = req.headers['x-refresh-token'];

        const refreshToken =
            typeof rawRefreshToken === 'string'
                ? rawRefreshToken
                : rawRefreshToken?.[0];

        if (!accessToken || !refreshToken) {
            return next();
        }

        try {
            const payload = this.authService.verifyAccessToken(accessToken);
            if (payload?.userId) {
                await this.authService.touchUserActivity(payload.userId);
            }
            return next();
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                try {
                    const { accessToken: newAccessToken } =
                        await this.authService.refresh(refreshToken);

                    req.headers['authorization'] = `Bearer ${newAccessToken}`;
                    const payload = this.authService.verifyAccessToken(newAccessToken);
                    if (payload?.userId) {
                        await this.authService.touchUserActivity(payload.userId);
                    }
                } catch(err) {
                    throw new UnauthorizedException('Invalid refresh token');
                }
            }
        }
        return next();
    }
}
