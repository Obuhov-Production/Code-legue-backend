import { Controller, Get, Patch, Post, Body, Req, Res, UseGuards, UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { EmailVerificationService } from '../email-verification/email-verification.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { GoogleOAuthGuard } from './guards/google-oauth.guard';
import { DiscordOAuthGuard } from './guards/discord-oauth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ConfigService } from '@nestjs/config';
import { GithubAuthGuard } from './guards/github-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService,
        private readonly emailVerification: EmailVerificationService,
    ) {}

    @Post('register')
    create(@Body() dto: CreateUserDto) {
        return this.authService.create(dto);
    }

    @Post('login')
    login(@Body() dto: LoginUserDto) {
        return this.authService.login(dto);
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    getMe(@Req() req: Request) {
        return this.authService.getMe((req.user as any).userId);
    }

    @Patch('me')
    @UseGuards(JwtAuthGuard)
    updateMe(@Req() req: Request, @Body() body: any) {
        return this.authService.updateMe((req.user as any).userId, body);
    }

    /* ── Email verification ───────────────────────────── */

    @Post('email/verify')
    async verifyEmailCode(@Body() body: { pendingToken: string; code: string }) {
        const user = await this.emailVerification.verifyByPendingToken(body.pendingToken, body.code);
        return this.authService.issueTokensForVerifiedUser(user);
    }

    @Post('email/resend')
    async resendEmailCode(@Body() body: { pendingToken: string }) {
        return this.emailVerification.resendByPendingToken(body.pendingToken);
    }

    /* ── Forgot password ──────────────────────────────── */

    @Post('password/forgot')
    forgotPasswordRequest(@Body() body: { email?: string }) {
        return this.authService.forgotPasswordRequest(String(body?.email ?? '').trim().toLowerCase());
    }

    @Post('password/forgot/verify')
    forgotPasswordVerify(@Body() body: { email?: string; code?: string }) {
        return this.authService.forgotPasswordVerifyCode(
            String(body?.email ?? '').trim().toLowerCase(),
            String(body?.code ?? '').trim(),
        );
    }

    @Post('password/forgot/reset')
    forgotPasswordReset(@Body() body: { email?: string; code?: string; newPassword?: string }) {
        if (!body?.email || !body?.code || !body?.newPassword) {
            throw new UnauthorizedException('email, code, newPassword required');
        }
        return this.authService.forgotPasswordReset(
            String(body.email).trim().toLowerCase(),
            String(body.code).trim(),
            String(body.newPassword),
        );
    }

    /* ── Google OAuth ─────────────────────────────────── */

    @Get('google')
    @UseGuards(GoogleOAuthGuard)
    googleLogin() {
        // Passport redirects to Google automatically
    }

    @Get('google/callback')
    @UseGuards(GoogleOAuthGuard)
    googleCallback(@Req() req: Request, @Res() res: Response) {
        return this.handleOAuthRedirect(req, res);
    }

    /* ── Discord OAuth ────────────────────────────────── */

    @Get('discord')
    @UseGuards(DiscordOAuthGuard)
    discordLogin() {
        // Passport redirects to Discord automatically
    }

    @Get('discord/callback')
    @UseGuards(DiscordOAuthGuard)
    discordCallback(@Req() req: Request, @Res() res: Response) {
        return this.handleOAuthRedirect(req, res);
    }

    /* ── GitHub OAuth ─────────────────────────────────── */

    @Get('github')
    @UseGuards(GithubAuthGuard)
    githubAuth() {
    }

    @Get('github/login')
    @UseGuards(GithubAuthGuard)
    githubLogin() {
    }

    @Get('github/callback')
    @UseGuards(GithubAuthGuard)
    githubCallback(@Req() req: Request, @Res() res: Response) {
        return this.handleOAuthRedirect(req, res);
    }

    /**
     * Загальний обробник OAuth-редіректів (Google/GitHub/Discord).
     * - Якщо акаунт верифікований → редірект на /login?oauth=success&token=...&user=...
     * - Якщо ні (новий або не підтверджений) → /login?pending=...&email=...
     */
    private handleOAuthRedirect(req: Request, res: Response) {
        const result = req.user as any;
        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:4000';

        if (result?.requiresVerification) {
            const params = new URLSearchParams({
                pending: result.pendingToken,
                email: result.email,
                expiresIn: String(result.expiresInSec ?? 600),
                source: 'oauth',
            });
            return res.redirect(`${frontendUrl}/login?${params.toString()}`);
        }

        const { token, user } = result;
        const encodedUser = encodeURIComponent(JSON.stringify(user));
        return res.redirect(`${frontendUrl}/login?oauth=success&token=${token}&user=${encodedUser}`);
    }

    @Post('verify')
    verify(@Body('token') token: string) {
        try {
            return this.authService.verifyAccessToken(token);
        } catch {
            throw new UnauthorizedException();
        }
    }

    @Post('refresh')
    refresh(@Body('refreshToken') refreshToken: string) {
        return this.authService.refresh(refreshToken);
    }
}
