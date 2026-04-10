"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TournamentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const tournament_entity_1 = require("./entities/tournament.entity");
const typeorm_2 = require("typeorm");
const TournamentStatus_enum_1 = require("./enums/TournamentStatus.enum");
let TournamentsService = class TournamentsService {
    tournamentRepository;
    constructor(tournamentRepository) {
        this.tournamentRepository = tournamentRepository;
    }
    async getAll(status) {
        const where = status ? { status } : {};
        const tournaments = await this.tournamentRepository.find({
            where,
            relations: {
                created_by: true,
                teams: true,
            },
            order: {
                created_at: 'DESC',
            },
        });
        return tournaments.map((t) => ({
            ...t,
            creator_name: t.created_by?.username,
            teams_count: t.teams?.length ?? 0,
        }));
    }
    async getById(id) {
        const tournament = await this.tournamentRepository.findOne({
            where: { id },
            relations: {
                created_by: true,
                teams: true,
            },
        });
        if (!tournament) {
            throw new common_1.NotFoundException('Tournament not found');
        }
        return {
            ...tournament,
            creator_name: tournament.created_by?.username,
            teams_count: tournament.teams?.length ?? 0,
        };
    }
    async create(dto) {
        const tournament = this.tournamentRepository.create({
            ...dto,
            status: TournamentStatus_enum_1.TournamentStatus.DRAFT,
            created_by: { id: dto.created_by_id },
        });
        const saved = await this.tournamentRepository.save(tournament);
        return saved.id;
    }
    async update(id, dto) {
        const result = await this.tournamentRepository.update({ id }, dto);
        if (result.affected === 0) {
            throw new common_1.NotFoundException('Tournament not found');
        }
        return { success: true };
    }
    async updateStatus(id, status) {
        const result = await this.tournamentRepository.update({ id }, { status });
        if (result.affected === 0) {
            throw new common_1.NotFoundException('Tournament not found');
        }
        return { success: true };
    }
    async delete(id) {
        const result = await this.tournamentRepository.delete({ id });
        if (result.affected === 0) {
            throw new common_1.NotFoundException('Tournament not found');
        }
        return { success: true };
    }
};
exports.TournamentsService = TournamentsService;
exports.TournamentsService = TournamentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(tournament_entity_1.Tournament)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], TournamentsService);
//# sourceMappingURL=tournaments.service.js.map