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
exports.EvaluationScore = void 0;
const typeorm_1 = require("typeorm");
const evaluation_entity_1 = require("../../evaluation/entities/evaluation.entity");
const evaluation_criterion_entity_1 = require("../../evaluation-criteria/entities/evaluation-criterion.entity");
let EvaluationScore = class EvaluationScore {
    id;
    evaluation_id;
    criteria_id;
    evaluation;
    criteria;
    score;
    created_at;
};
exports.EvaluationScore = EvaluationScore;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], EvaluationScore.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], EvaluationScore.prototype, "evaluation_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], EvaluationScore.prototype, "criteria_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => evaluation_entity_1.Evaluation, (evaluation) => evaluation.scores, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'evaluation_id' }),
    __metadata("design:type", evaluation_entity_1.Evaluation)
], EvaluationScore.prototype, "evaluation", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => evaluation_criterion_entity_1.EvaluationCriteria, (criteria) => criteria.scores, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'criteria_id' }),
    __metadata("design:type", evaluation_criterion_entity_1.EvaluationCriteria)
], EvaluationScore.prototype, "criteria", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 5, scale: 2 }),
    __metadata("design:type", Number)
], EvaluationScore.prototype, "score", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], EvaluationScore.prototype, "created_at", void 0);
exports.EvaluationScore = EvaluationScore = __decorate([
    (0, typeorm_1.Entity)('evaluation_scores'),
    (0, typeorm_1.Unique)('unique_score_per_evaluation_criteria', ['evaluation_id', 'criteria_id'])
], EvaluationScore);
//# sourceMappingURL=evaluation-score.entity.js.map