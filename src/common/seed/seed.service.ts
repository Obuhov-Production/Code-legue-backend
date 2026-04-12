import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../modules/users/entities/user.entity';
import { UserRole } from '../../modules/users/enums/UserRole.enum';
import { Tournament } from '../../modules/tournaments/entities/tournament.entity';
import { TournamentStatus } from '../../modules/tournaments/enums/TournamentStatus.enum';
import { TournamentCategory } from '../../modules/tournaments/enums/TournamentCategory.enum';
import { TournamentFormat } from '../../modules/tournaments/enums/TournamentFormat.enum';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
    private readonly logger = new Logger(SeedService.name);

    constructor(
        @InjectRepository(User) private readonly userRepo: Repository<User>,
        @InjectRepository(Tournament) private readonly tournamentRepo: Repository<Tournament>,
    ) {}

    async onApplicationBootstrap() {
        if (process.env.SEED_ENABLED === 'false') {
            this.logger.log('⏭️  Seeding disabled (SEED_ENABLED=false)');
            return;
        }
        await this.seedAdminUser();
        if (process.env.SEED_TOURNAMENTS !== 'false') {
            await this.seedTournaments();
        }
    }

    private async seedAdminUser() {
        const email = process.env.SEED_ADMIN_EMAIL || 'admin@codeleague.com';
        const password = process.env.SEED_ADMIN_PASSWORD || 'Admin123!';
        const username = process.env.SEED_ADMIN_USERNAME || 'admin';

        const exists = await this.userRepo.findOne({ where: { email } });
        if (exists) return;

        const hashed = await bcrypt.hash(password, 10);
        const admin = this.userRepo.create({
            email,
            username,
            password: hashed,
            role: UserRole.ADMIN,
        });
        await this.userRepo.save(admin);
        this.logger.log(`✅ Admin user created: ${email} / ${password}`);
    }

    private async seedTournaments() {
        const now = new Date();
        const d = (offsetDays: number) => {
            const dt = new Date(now);
            dt.setDate(dt.getDate() + offsetDays);
            return dt;
        };

        const tournaments = [
            {
                name: 'Code League 2026 — Hackathon',
                description: 'Головний гакатон сезону 2026. Розроби продукт за 48 годин.',
                rules: 'Команди від 2 до 5 осіб. Заборонено використовувати готові шаблони.',
                category: TournamentCategory.HACKATHON,
                format: TournamentFormat.ONLINE,
                prize: '1 місце — 30 000 грн, 2 місце — 15 000 грн, 3 місце — 7 000 грн',
                status: TournamentStatus.DRAFT,
                start_date: d(30),
                end_date: d(32),
                registration_start: d(1),
                registration_end: d(28),
                teams_limit: 50,
                rounds_count: 3,
                min_team_size: 2,
                max_team_size: 5,
            },
            {
                name: 'Spring Olympiad 2026',
                description: 'Весняна олімпіада з алгоритмізації та структур даних.',
                rules: 'Індивідуальна участь. 3 раунди, кожний по 2 години.',
                category: TournamentCategory.OLYMPIAD,
                format: TournamentFormat.HYBRID,
                prize: 'Дипломи переможців + сертифікати всім фіналістам',
                status: TournamentStatus.REGISTRATION,
                start_date: d(14),
                end_date: d(16),
                registration_start: d(-7),
                registration_end: d(12),
                teams_limit: null,
                rounds_count: 3,
                min_team_size: 2,
                max_team_size: 4,
            },
            {
                name: 'Backend Sprint Challenge',
                description: 'Швидкісний чемпіонат з розробки REST API. 24 години — реальний продукт.',
                rules: 'Команди до 3 осіб. Обов’язкова документація API.',
                category: TournamentCategory.SPRINT,
                format: TournamentFormat.ONLINE,
                prize: 'Кешбек від спонсорів + офери роботи для топ-5 теамів',
                status: TournamentStatus.RUNNING,
                start_date: d(-3),
                end_date: d(1),
                registration_start: d(-20),
                registration_end: d(-4),
                teams_limit: 30,
                rounds_count: 2,
                min_team_size: 2,
                max_team_size: 3,
            },
            {
                name: 'Winter Code Marathon 2025',
                description: 'Зимовий марафон — 72 години неспинного кодингу.',
                rules: 'Команди від 2 до 4 осіб. Оприлюднюється жюрі.',
                category: TournamentCategory.MARATHON,
                format: TournamentFormat.OFFLINE,
                prize: 'Грошові призи + медалі',
                status: TournamentStatus.FINISHED,
                start_date: d(-90),
                end_date: d(-87),
                registration_start: d(-120),
                registration_end: d(-92),
                teams_limit: 20,
                rounds_count: 4,
                min_team_size: 2,
                max_team_size: 4,
            },
        ];

        await this.tournamentRepo.save(
            tournaments.map(t => this.tournamentRepo.create(t)),
        );
        this.logger.log(`✅ Seeded ${tournaments.length} tournaments`);
    }
}
