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
exports.User = void 0;
const typeorm_1 = require("typeorm");
const UserRole_enum_1 = require("../enums/UserRole.enum");
const tournament_entity_1 = require("../../tournaments/entities/tournament.entity");
const team_entity_1 = require("../../teams/entities/team.entity");
const jury_assignment_entity_1 = require("../../jury-assignments/entities/jury-assignment.entity");
const evaluation_entity_1 = require("../../evaluation/entities/evaluation.entity");
const chat_reaction_entity_1 = require("../../chat-reactions/entities/chat-reaction.entity");
const chat_room_entity_1 = require("../../chat-room/entities/chat-room.entity");
const chat_pinned_entity_1 = require("../../chat-pinned/entities/chat-pinned.entity");
const chat_message_entity_1 = require("../../chat-messages/entities/chat-message.entity");
let User = class User {
    id;
    username;
    email;
    password;
    role;
    user_description;
    user_avatar_url;
    banner_color;
    banner_url;
    is_chat_muted;
    created_at;
    username_updated_at;
    tournaments;
    captained_teams;
    juryAssignments;
    evaluations;
    createdRooms;
    chatReactions;
    pinnedMessages;
    messages;
};
exports.User = User;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], User.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], User.prototype, "username", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], User.prototype, "password", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: UserRole_enum_1.UserRole,
        default: UserRole_enum_1.UserRole.USER,
    }),
    __metadata("design:type", String)
], User.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], User.prototype, "user_description", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "user_avatar_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "banner_color", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "banner_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "is_chat_muted", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], User.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], User.prototype, "username_updated_at", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => tournament_entity_1.Tournament, (tournament) => tournament.created_by),
    __metadata("design:type", Array)
], User.prototype, "tournaments", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => team_entity_1.Team, (team) => team.captain),
    __metadata("design:type", Array)
], User.prototype, "captained_teams", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => jury_assignment_entity_1.JuryAssignment, (ja) => ja.jury),
    __metadata("design:type", Array)
], User.prototype, "juryAssignments", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => evaluation_entity_1.Evaluation, (evaluation) => evaluation.jury),
    __metadata("design:type", Array)
], User.prototype, "evaluations", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => chat_room_entity_1.ChatRoom, (room) => room.creator),
    __metadata("design:type", Array)
], User.prototype, "createdRooms", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => chat_reaction_entity_1.ChatReaction, (reaction) => reaction.user),
    __metadata("design:type", Array)
], User.prototype, "chatReactions", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => chat_pinned_entity_1.ChatPinned, (pin) => pin.user),
    __metadata("design:type", Array)
], User.prototype, "pinnedMessages", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => chat_message_entity_1.Message, (message) => message.user),
    __metadata("design:type", Array)
], User.prototype, "messages", void 0);
exports.User = User = __decorate([
    (0, typeorm_1.Entity)('users')
], User);
//# sourceMappingURL=user.entity.js.map