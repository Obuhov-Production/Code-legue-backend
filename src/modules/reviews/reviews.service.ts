import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { CreateReviewDto } from './dto/create-review.dto';

function format(review: Review) {
    return {
        id: review.id,
        author: review.name,
        text: review.text,
        rating: review.rating,
        createdAt: review.created_at,
    };
}

@Injectable()
export class ReviewsService {
    constructor(
        @InjectRepository(Review) private readonly reviewRepo: Repository<Review>,
    ) {}

    async findAll(q?: string) {
        const where = q
            ? [{ name: ILike(`%${q}%`) }, { text: ILike(`%${q}%`) }]
            : undefined;
        const reviews = await this.reviewRepo.find({
            where,
            order: { created_at: 'DESC' },
        });
        return reviews.map(format);
    }

    async create(dto: CreateReviewDto, userId?: number) {
        if (userId) {
            const existing = await this.reviewRepo.findOne({ where: { user_id: userId } });
            if (existing) {
                throw new ConflictException('Ви вже залишили відгук');
            }
        }
        const review = this.reviewRepo.create({
            name: dto.name,
            email: dto.email ?? '',
            rating: dto.rating,
            text: dto.text,
            user_id: userId ?? undefined,
        });
        const saved = await this.reviewRepo.save(review);
        return format(saved);
    }
}
