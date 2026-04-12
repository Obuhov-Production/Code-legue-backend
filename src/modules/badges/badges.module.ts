import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Badge } from './entities/badge.entity';
import { BadgesService } from './badges.service';
import { BadgesController, AdminBadgesController } from './badges.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Badge])],
    controllers: [BadgesController, AdminBadgesController],
    providers: [BadgesService],
})
export class BadgesModule {}
