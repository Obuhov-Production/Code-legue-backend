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
exports.Tournament = void 0;
const typeorm_1 = require("typeorm");
const TournamentStatus_enum_1 = require("../enums/TournamentStatus.enum");
const user_entity_1 = require("../../users/entities/user.entity");
const team_entity_1 = require("../../teams/entities/team.entity");
const team_member_entity_1 = require("../../team-members/entities/team-member.entity");
const round_entity_1 = require("../../rounds/entities/round.entity");
const announcement_entity_1 = require("../../announcements/entities/announcement.entity");
let Tournament = class Tournament {
    id;
    name;
    description;
    rules;
    status;
    start_date;
    end_date;
    registration_start;
    registration_end;
    teams_limit;
    rounds_count;
    min_team_size;
    max_team_size;
    created_by;
    created_by_id;
    announcements;
    created_at;
    teams;
    members;
    rounds;
};
exports.Tournament = Tournament;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Tournament.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Tournament.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Tournament.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Tournament.prototype, "rules", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: TournamentStatus_enum_1.TournamentStatus,
        default: TournamentStatus_enum_1.TournamentStatus.DRAFT,
    }),
    __metadata("design:type", String)
], Tournament.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], Tournament.prototype, "start_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], Tournament.prototype, "end_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], Tournament.prototype, "registration_start", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], Tournament.prototype, "registration_end", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], Tournament.prototype, "teams_limit", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], Tournament.prototype, "rounds_count", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], Tournament.prototype, "min_team_size", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], Tournament.prototype, "max_team_size", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", user_entity_1.User)
], Tournament.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], Tournament.prototype, "created_by_id", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => announcement_entity_1.Announcement, (announcement) => announcement.tournament),
    __metadata("design:type", Array)
], Tournament.prototype, "announcements", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Tournament.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => team_entity_1.Team, (team) => team.tournament),
    __metadata("design:type", Array)
], Tournament.prototype, "teams", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => team_member_entity_1.TeamMember, (member) => member.tournament),
    __metadata("design:type", Array)
], Tournament.prototype, "members", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => round_entity_1.Round, (round) => round.tournament),
    __metadata("design:type", Array)
], Tournament.prototype, "rounds", void 0);
exports.Tournament = Tournament = __decorate([
    (0, typeorm_1.Entity)('tournaments'),
    (0, typeorm_1.Check)(`"rounds_count" >= 1`),
    (0, typeorm_1.Check)(`"min_team_size" >= 2`),
    (0, typeorm_1.Check)(`"max_team_size" >= "min_team_size"`),
    (0, typeorm_1.Check)(`"end_date" > "start_date"`),
    (0, typeorm_1.Check)(`"registration_end" >= "registration_start"`)
], Tournament);
//# sourceMappingURL=tournament.entity.js.map