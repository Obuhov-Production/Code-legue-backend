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
exports.ChatRoomSettingsController = void 0;
const common_1 = require("@nestjs/common");
const chat_room_settings_service_1 = require("./chat-room-settings.service");
let ChatRoomSettingsController = class ChatRoomSettingsController {
    chatRoomSettingsService;
    constructor(chatRoomSettingsService) {
        this.chatRoomSettingsService = chatRoomSettingsService;
    }
};
exports.ChatRoomSettingsController = ChatRoomSettingsController;
exports.ChatRoomSettingsController = ChatRoomSettingsController = __decorate([
    (0, common_1.Controller)('chat-room-settings'),
    __metadata("design:paramtypes", [chat_room_settings_service_1.ChatRoomSettingsService])
], ChatRoomSettingsController);
//# sourceMappingURL=chat-room-settings.controller.js.map