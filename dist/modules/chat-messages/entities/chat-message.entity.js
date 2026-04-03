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
exports.Message = void 0;
const typeorm_1 = require("typeorm");
const chat_room_entity_1 = require("../../chat-room/entities/chat-room.entity");
const user_entity_1 = require("../../users/entities/user.entity");
const chat_reaction_entity_1 = require("../../chat-reactions/entities/chat-reaction.entity");
const chat_pinned_entity_1 = require("../../chat-pinned/entities/chat-pinned.entity");
let Message = class Message {
    id;
    room;
    chatRoom;
    user_id;
    user;
    text;
    created_at;
    reply_to_id;
    replyTo;
    reactions;
    pinnedIn;
    file_url;
    edited_at;
    deleted;
    msg_type;
};
exports.Message = Message;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Message.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)('text'),
    __metadata("design:type", String)
], Message.prototype, "room", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => chat_room_entity_1.ChatRoom, (room) => room.messages, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'room', referencedColumnName: 'name' }),
    __metadata("design:type", chat_room_entity_1.ChatRoom)
], Message.prototype, "chatRoom", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Message.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.messages, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], Message.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)('text'),
    __metadata("design:type", String)
], Message.prototype, "text", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], Message.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Message.prototype, "reply_to_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Message, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'reply_to_id' }),
    __metadata("design:type", Message)
], Message.prototype, "replyTo", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => chat_reaction_entity_1.ChatReaction, (reaction) => reaction.message),
    __metadata("design:type", Array)
], Message.prototype, "reactions", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => chat_pinned_entity_1.ChatPinned, (pin) => pin.message),
    __metadata("design:type", Array)
], Message.prototype, "pinnedIn", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500, nullable: true }),
    __metadata("design:type", String)
], Message.prototype, "file_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], Message.prototype, "edited_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Message.prototype, "deleted", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, default: 'user' }),
    __metadata("design:type", String)
], Message.prototype, "msg_type", void 0);
exports.Message = Message = __decorate([
    (0, typeorm_1.Entity)('messages')
], Message);
//# sourceMappingURL=chat-message.entity.js.map