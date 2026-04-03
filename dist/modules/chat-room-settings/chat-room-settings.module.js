"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatRoomSettingsModule = void 0;
const common_1 = require("@nestjs/common");
const chat_room_settings_service_1 = require("./chat-room-settings.service");
const chat_room_settings_controller_1 = require("./chat-room-settings.controller");
const typeorm_1 = require("@nestjs/typeorm");
const chat_room_setting_entity_1 = require("./entities/chat-room-setting.entity");
let ChatRoomSettingsModule = class ChatRoomSettingsModule {
};
exports.ChatRoomSettingsModule = ChatRoomSettingsModule;
exports.ChatRoomSettingsModule = ChatRoomSettingsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([chat_room_setting_entity_1.ChatRoomSettings])],
        controllers: [chat_room_settings_controller_1.ChatRoomSettingsController],
        providers: [chat_room_settings_service_1.ChatRoomSettingsService],
    })
], ChatRoomSettingsModule);
//# sourceMappingURL=chat-room-settings.module.js.map