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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Round = void 0;
const typeorm_1 = require("typeorm");
const tournament_entity_1 = require("../../tournaments/entities/tournament.entity");
const submission_entity_1 = require("../../submissions/entities/submission.entity");
const task_entity_1 = require("../../tasks/entities/task.entity");
const RoundStatus_1 = require("../enums/RoundStatus");
const evaluation_criterion_entity_1 = require("../../evaluation-criteria/entities/evaluation-criterion.entity");
let Round = class Round {
    id;
    tournament_id;
    tournament;
    criteria;
    title;
    description;
    status;
    start_date;
    end_date;
    created_at;
    submissions;
    tasks;
};
exports.Round = Round;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Round.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Round.prototype, "tournament_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => tournament_entity_1.Tournament, (tournament) => tournament.rounds, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'tournament_id' }),
    __metadata("design:type", tournament_entity_1.Tournament)
], Round.prototype, "tournament", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => evaluation_criterion_entity_1.EvaluationCriteria, (criteria) => criteria.round),
    __metadata("design:type", Array)
], Round.prototype, "criteria", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], Round.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { nullable: true }),
    __metadata("design:type", String)
], Round.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: RoundStatus_1.RoundStatus,
        default: RoundStatus_1.RoundStatus.DRAFT,
    }),
    __metadata("design:type", String)
], Round.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime' }),
    __metadata("design:type", Date)
], Round.prototype, "start_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime' }),
    __metadata("design:type", Date)
], Round.prototype, "end_date", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], Round.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => submission_entity_1.Submission, (submission) => submission.round),
    __metadata("design:type", Array)
], Round.prototype, "submissions", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => task_entity_1.Task, (task) => task.round),
    __metadata("design:type", Array)
], Round.prototype, "tasks", void 0);
exports.Round = Round = __decorate([
    (0, typeorm_1.Entity)('rounds'),
    (0, typeorm_1.Unique)('unique_round_title_per_tournament', ['tournament_id', 'title'])
], Round);
//# sourceMappingURL=round.entity.js.map