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
exports.Submission = void 0;
const typeorm_1 = require("typeorm");
const team_entity_1 = require("../../teams/entities/team.entity");
const SubmissionStatus_1 = require("../enums/SubmissionStatus");
const round_entity_1 = require("../../rounds/entities/round.entity");
const jury_assignment_entity_1 = require("../../jury-assignments/entities/jury-assignment.entity");
const evaluation_entity_1 = require("../../evaluation/entities/evaluation.entity");
let Submission = class Submission {
    id;
    team_id;
    round_id;
    team;
    round;
    juryAssignments;
    evaluations;
    github_url;
    video_url;
    live_demo_url;
    description;
    status;
    submitted_at;
    updated_at;
};
exports.Submission = Submission;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Submission.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Submission.prototype, "team_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Submission.prototype, "round_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => team_entity_1.Team, (team) => team.submissions, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'team_id' }),
    __metadata("design:type", team_entity_1.Team)
], Submission.prototype, "team", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => round_entity_1.Round, (round) => round.submissions, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'round_id' }),
    __metadata("design:type", round_entity_1.Round)
], Submission.prototype, "round", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => jury_assignment_entity_1.JuryAssignment, (ja) => ja.submission),
    __metadata("design:type", Array)
], Submission.prototype, "juryAssignments", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => evaluation_entity_1.Evaluation, (evaluation) => evaluation.submission),
    __metadata("design:type", Array)
], Submission.prototype, "evaluations", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500 }),
    __metadata("design:type", String)
], Submission.prototype, "github_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500 }),
    __metadata("design:type", String)
], Submission.prototype, "video_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500, nullable: true }),
    __metadata("design:type", String)
], Submission.prototype, "live_demo_url", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { nullable: true }),
    __metadata("design:type", String)
], Submission.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: SubmissionStatus_1.SubmissionStatus,
        default: SubmissionStatus_1.SubmissionStatus.DRAFT,
    }),
    __metadata("design:type", String)
], Submission.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], Submission.prototype, "submitted_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Submission.prototype, "updated_at", void 0);
exports.Submission = Submission = __decorate([
    (0, typeorm_1.Entity)('submissions'),
    (0, typeorm_1.Unique)('unique_team_round_submission', ['team_id', 'round_id'])
], Submission);
//# sourceMappingURL=submission.entity.js.map