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
exports.ChatRoom = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
const chat_room_setting_entity_1 = require("../../chat-room-settings/entities/chat-room-setting.entity");
const chat_pinned_entity_1 = require("../../chat-pinned/entities/chat-pinned.entity");
const chat_message_entity_1 = require("../../chat-messages/entities/chat-message.entity");
let ChatRoom = class ChatRoom {
    id;
    name;
    label;
    created_by;
    creator;
    created_at;
    settings;
    pinnedMessages;
    messages;
};
exports.ChatRoom = ChatRoom;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ChatRoom.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], ChatRoom.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], ChatRoom.prototype, "label", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], ChatRoom.prototype, "created_by", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.createdRooms, {
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", user_entity_1.User)
], ChatRoom.prototype, "creator", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], ChatRoom.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => chat_room_setting_entity_1.ChatRoomSettings, (settings) => settings.chatRoom),
    __metadata("design:type", chat_room_setting_entity_1.ChatRoomSettings)
], ChatRoom.prototype, "settings", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => chat_pinned_entity_1.ChatPinned, (pin) => pin.chatRoom),
    __metadata("design:type", Array)
], ChatRoom.prototype, "pinnedMessages", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => chat_message_entity_1.Message, (message) => message.chatRoom),
    __metadata("design:type", Array)
], ChatRoom.prototype, "messages", void 0);
exports.ChatRoom = ChatRoom = __decorate([
    (0, typeorm_1.Entity)('chat_rooms'),
    (0, typeorm_1.Unique)(['name'])
], ChatRoom);
//# sourceMappingURL=chat-room.entity.js.map