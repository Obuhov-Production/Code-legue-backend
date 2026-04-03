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
exports.EvaluationCriteria = void 0;
const typeorm_1 = require("typeorm");
const round_entity_1 = require("../../rounds/entities/round.entity");
const evaluation_score_entity_1 = require("../../evaluation-scores/entities/evaluation-score.entity");
let EvaluationCriteria = class EvaluationCriteria {
    id;
    round_id;
    round;
    name;
    max_score;
    created_at;
    scores;
};
exports.EvaluationCriteria = EvaluationCriteria;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], EvaluationCriteria.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], EvaluationCriteria.prototype, "round_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => round_entity_1.Round, (round) => round.criteria, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'round_id' }),
    __metadata("design:type", round_entity_1.Round)
], EvaluationCriteria.prototype, "round", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], EvaluationCriteria.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)('int'),
    __metadata("design:type", Number)
], EvaluationCriteria.prototype, "max_score", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], EvaluationCriteria.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => evaluation_score_entity_1.EvaluationScore, (score) => score.criteria),
    __metadata("design:type", Array)
], EvaluationCriteria.prototype, "scores", void 0);
exports.EvaluationCriteria = EvaluationCriteria = __decorate([
    (0, typeorm_1.Entity)('evaluation_criteria'),
    (0, typeorm_1.Unique)('unique_criterion_per_round', ['round_id', 'name'])
], EvaluationCriteria);
//# sourceMappingURL=evaluation-criterion.entity.js.map