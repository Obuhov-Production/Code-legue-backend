"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatPinnedModule = void 0;
const common_1 = require("@nestjs/common");
const chat_pinned_service_1 = require("./chat-pinned.service");
const chat_pinned_controller_1 = require("./chat-pinned.controller");
const typeorm_1 = require("@nestjs/typeorm");
const chat_pinned_entity_1 = require("./entities/chat-pinned.entity");
let ChatPinnedModule = class ChatPinnedModule {
};
exports.ChatPinnedModule = ChatPinnedModule;
exports.ChatPinnedModule = ChatPinnedModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([chat_pinned_entity_1.ChatPinned])],
        controllers: [chat_pinned_controller_1.ChatPinnedController],
        providers: [chat_pinned_service_1.ChatPinnedService],
    })
], ChatPinnedModule);
//# sourceMappingURL=chat-pinned.module.js.map