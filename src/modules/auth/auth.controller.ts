import { Controller, Get, Post, Body, Req, Res, UseGuards, UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { GoogleOAuthGuard } from './guards/google-oauth.guard';
import { DiscordOAuthGuard } from './guards/discord-oauth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly configService: ConfigService,
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

    /* ── Google OAuth ─────────────────────────────────── */

    @Get('google')
    @UseGuards(GoogleOAuthGuard)
    googleLogin() {
        // Passport redirects to Google automatically
    }

    @Get('google/callback')
    @UseGuards(GoogleOAuthGuard)
    googleCallback(@Req() req: Request, @Res() res: Response) {
        const { token } = req.user as any;
        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
        return res.redirect(`${frontendUrl}/login?oauth=success&token=${token}`);
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
        const { token } = req.user as any;
        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
        return res.redirect(`${frontendUrl}/login?oauth=success&token=${token}`);
    }
}
