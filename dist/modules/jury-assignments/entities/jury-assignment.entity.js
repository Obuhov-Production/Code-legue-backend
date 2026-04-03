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
exports.JuryAssignment = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
const submission_entity_1 = require("../../submissions/entities/submission.entity");
let JuryAssignment = class JuryAssignment {
    id;
    jury_id;
    submission_id;
    jury;
    submission;
    comment;
    total_score;
    assigned_at;
};
exports.JuryAssignment = JuryAssignment;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], JuryAssignment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], JuryAssignment.prototype, "jury_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], JuryAssignment.prototype, "submission_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.juryAssignments, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'jury_id' }),
    __metadata("design:type", user_entity_1.User)
], JuryAssignment.prototype, "jury", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => submission_entity_1.Submission, (submission) => submission.juryAssignments, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'submission_id' }),
    __metadata("design:type", submission_entity_1.Submission)
], JuryAssignment.prototype, "submission", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { nullable: true }),
    __metadata("design:type", String)
], JuryAssignment.prototype, "comment", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 6, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], JuryAssignment.prototype, "total_score", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], JuryAssignment.prototype, "assigned_at", void 0);
exports.JuryAssignment = JuryAssignment = __decorate([
    (0, typeorm_1.Entity)('jury_assignments'),
    (0, typeorm_1.Unique)('unique_jury_submission', ['jury_id', 'submission_id'])
], JuryAssignment);
//# sourceMappingURL=jury-assignment.entity.js.map