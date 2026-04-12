import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
    constructor(
        @InjectRepository(Review) private readonly reviewRepo: Repository<Review>,
    ) {}

    async findAll(): Promise<Review[]> {
        return this.reviewRepo.find({
            relations: ['user'],
            order: { created_at: 'DESC' },
        });
    }

    async create(dto: CreateReviewDto, userId?: number): Promise<Review> {
        const review = this.reviewRepo.create({
            ...dto,
            user_id: userId ?? undefined,
        });
        return this.reviewRepo.save(review);
    }
}
