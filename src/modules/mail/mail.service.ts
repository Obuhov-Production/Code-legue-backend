import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { verifyEmailHtml, verifyEmailText } from './templates/verify-email.template';

/**
 * Універсальний модуль відправки email через SMTP.
 *
 * Налаштовується повністю через .env — для Gmail використовуйте App Password
 * (не звичайний пароль): https://myaccount.google.com/apppasswords
 *
 * Змінні .env:
 *   SMTP_HOST            — за замовчуванням smtp.gmail.com
 *   SMTP_PORT            — 465 (SSL) або 587 (STARTTLS)
 *   SMTP_SECURE          — true для 465, false для 587
 *   SMTP_USER            — повна email-адреса відправника
 *   SMTP_PASS            — пароль або Gmail App Password
 *   MAIL_FROM            — адреса в полі "From" (за замовчуванням SMTP_USER)
 *   MAIL_FROM_NAME       — ім'я відправника
 *   MAIL_APP_NAME        — назва, яка з'являтиметься у тілі листа
 */
@Injectable()
export class MailService implements OnModuleInit {
    private readonly logger = new Logger(MailService.name);
    private transporter: Transporter | null = null;
    private appName = 'Code League';

    constructor(private readonly config: ConfigService) {}

    onModuleInit() {
        this.appName = this.config.get<string>('MAIL_APP_NAME') || 'Code League';
        const host    = this.config.get<string>('SMTP_HOST') || 'smtp.gmail.com';
        const portStr = this.config.get<string>('SMTP_PORT') || '465';
        const port    = parseInt(portStr, 10);
        const secure  = (this.config.get<string>('SMTP_SECURE') || (port === 465 ? 'true' : 'false')) === 'true';
        const user    = this.config.get<string>('SMTP_USER');
        const pass    = this.config.get<string>('SMTP_PASS');

        if (!user || !pass) {
            this.logger.warn(
                'SMTP_USER / SMTP_PASS не задано — пошта не надсилатиметься. ' +
                'Додайте змінні у .env щоб увімкнути відправку.',
            );
            return;
        }

        this.transporter = nodemailer.createTransport({
            host,
            port,
            secure,
            auth: { user, pass },
        });

        this.transporter.verify()
            .then(() => this.logger.log(`SMTP готовий: ${host}:${port} (secure=${secure})`))
            .catch((err) => this.logger.error(`SMTP не вдалось підключити: ${err.message}`));
    }

    private getFrom(): string {
        const fromName  = this.config.get<string>('MAIL_FROM_NAME') || this.appName;
        const fromEmail = this.config.get<string>('MAIL_FROM') || this.config.get<string>('SMTP_USER') || '';
        return `"${fromName}" <${fromEmail}>`;
    }

    /**
     * Базовий метод — відправляє довільний лист.
     * Якщо SMTP не налаштовано — пише попередження і не кидає помилку
     * (щоб у DEV-режимі без SMTP можна було продовжувати тестувати UI).
     */
    async send(opts: { to: string; subject: string; html: string; text?: string }): Promise<void> {
        if (!this.transporter) {
            this.logger.warn(`[MAIL DRY-RUN] → ${opts.to}: ${opts.subject}`);
            return;
        }

        try {
            await this.transporter.sendMail({
                from:    this.getFrom(),
                to:      opts.to,
                subject: opts.subject,
                html:    opts.html,
                text:    opts.text,
            });
            this.logger.log(`Sent "${opts.subject}" → ${opts.to}`);
        } catch (err: any) {
            this.logger.error(`Email failed → ${opts.to}: ${err.message}`);
            throw err;
        }
    }

    async sendVerificationCode(to: string, code: string, expiresInMinutes = 10): Promise<void> {
        const subject = `${this.appName} — код підтвердження ${code}`;
        const html    = verifyEmailHtml({ code, appName: this.appName, expiresInMinutes });
        const text    = verifyEmailText({ code, appName: this.appName, expiresInMinutes });
        await this.send({ to, subject, html, text });
    }
}
