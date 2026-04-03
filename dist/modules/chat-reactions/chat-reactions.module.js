"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatReactionsModule = void 0;
const common_1 = require("@nestjs/common");
const chat_reactions_service_1 = require("./chat-reactions.service");
const chat_reactions_controller_1 = require("./chat-reactions.controller");
const typeorm_1 = require("@nestjs/typeorm");
const chat_reaction_entity_1 = require("./entities/chat-reaction.entity");
let ChatReactionsModule = class ChatReactionsModule {
};
exports.ChatReactionsModule = ChatReactionsModule;
exports.ChatReactionsModule = ChatReactionsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([chat_reaction_entity_1.ChatReaction])],
        controllers: [chat_reactions_controller_1.ChatReactionsController],
        providers: [chat_reactions_service_1.ChatReactionsService],
    })
], ChatReactionsModule);
//# sourceMappingURL=chat-reactions.module.js.map