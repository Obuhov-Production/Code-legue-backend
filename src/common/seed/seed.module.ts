import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { User } from '../../modules/users/entities/user.entity';
import { Tournament } from '../../modules/tournaments/entities/tournament.entity';

@Module({
    imports: [TypeOrmModule.forFeature([User, Tournament])],
    providers: [SeedService],
})
export class SeedModule {}
