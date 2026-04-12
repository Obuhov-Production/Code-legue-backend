import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../modules/users/entities/user.entity';
import { UserRole } from '../../modules/users/enums/UserRole.enum';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
    private readonly logger = new Logger(SeedService.name);

    constructor(
        @InjectRepository(User) private readonly userRepo: Repository<User>,
    ) {}

    async onApplicationBootstrap() {
        await this.seedAdminUser();
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
}
