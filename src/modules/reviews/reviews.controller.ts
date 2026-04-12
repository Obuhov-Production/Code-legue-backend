import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reviews')
export class ReviewsController {
    constructor(private readonly reviewsService: ReviewsService) {}

    @Get()
    findAll(@Query('q') q?: string) {
        return this.reviewsService.findAll(q);
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    create(@Body() dto: CreateReviewDto, @Req() req: Request) {
        const userId = (req.user as any)?.userId;
        return this.reviewsService.create(dto, userId);
    }
}
