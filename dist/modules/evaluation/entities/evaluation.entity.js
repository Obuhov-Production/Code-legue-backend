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
exports.Evaluation = void 0;
const typeorm_1 = require("typeorm");
const submission_entity_1 = require("../../submissions/entities/submission.entity");
const user_entity_1 = require("../../users/entities/user.entity");
const evaluation_score_entity_1 = require("../../evaluation-scores/entities/evaluation-score.entity");
let Evaluation = class Evaluation {
    id;
    submission_id;
    jury_id;
    submission;
    scores;
    jury;
    comment;
    total_score;
    created_at;
};
exports.Evaluation = Evaluation;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Evaluation.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Evaluation.prototype, "submission_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Evaluation.prototype, "jury_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => submission_entity_1.Submission, (submission) => submission.evaluations, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'submission_id' }),
    __metadata("design:type", submission_entity_1.Submission)
], Evaluation.prototype, "submission", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.evaluations, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.OneToMany)(() => evaluation_score_entity_1.EvaluationScore, (score) => score.evaluation),
    __metadata("design:type", Array)
], Evaluation.prototype, "scores", void 0);
__decorate([
    (0, typeorm_1.JoinColumn)({ name: 'jury_id' }),
    __metadata("design:type", user_entity_1.User)
], Evaluation.prototype, "jury", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { nullable: true }),
    __metadata("design:type", Object)
], Evaluation.prototype, "comment", void 0);
__decorate([
    (0, typeorm_1.Column)('int'),
    __metadata("design:type", Number)
], Evaluation.prototype, "total_score", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], Evaluation.prototype, "created_at", void 0);
exports.Evaluation = Evaluation = __decorate([
    (0, typeorm_1.Entity)('evaluation'),
    (0, typeorm_1.Unique)('unique_jury_submission_evaluation', ['submission_id', 'jury_id'])
], Evaluation);
//# sourceMappingURL=evaluation.entity.js.map