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
exports.ChatPinned = void 0;
const typeorm_1 = require("typeorm");
const chat_room_entity_1 = require("../../chat-room/entities/chat-room.entity");
const user_entity_1 = require("../../users/entities/user.entity");
const chat_message_entity_1 = require("../../chat-messages/entities/chat-message.entity");
let ChatPinned = class ChatPinned {
    id;
    room;
    chatRoom;
    message_id;
    message;
    pinned_by;
    user;
    pinned_at;
};
exports.ChatPinned = ChatPinned;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ChatPinned.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)('text'),
    __metadata("design:type", String)
], ChatPinned.prototype, "room", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => chat_room_entity_1.ChatRoom, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'room', referencedColumnName: 'name' }),
    __metadata("design:type", chat_room_entity_1.ChatRoom)
], ChatPinned.prototype, "chatRoom", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], ChatPinned.prototype, "message_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => chat_message_entity_1.Message, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'message_id' }),
    __metadata("design:type", chat_message_entity_1.Message)
], ChatPinned.prototype, "message", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], ChatPinned.prototype, "pinned_by", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'pinned_by' }),
    __metadata("design:type", user_entity_1.User)
], ChatPinned.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], ChatPinned.prototype, "pinned_at", void 0);
exports.ChatPinned = ChatPinned = __decorate([
    (0, typeorm_1.Entity)('chat_pinned'),
    (0, typeorm_1.Unique)('unique_room_message', ['room', 'message_id'])
], ChatPinned);
//# sourceMappingURL=chat-pinned.entity.js.map