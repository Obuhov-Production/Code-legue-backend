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
exports.ChatReactionsController = void 0;
const common_1 = require("@nestjs/common");
const chat_reactions_service_1 = require("./chat-reactions.service");
let ChatReactionsController = class ChatReactionsController {
    chatReactionsService;
    constructor(chatReactionsService) {
        this.chatReactionsService = chatReactionsService;
    }
};
exports.ChatReactionsController = ChatReactionsController;
exports.ChatReactionsController = ChatReactionsController = __decorate([
    (0, common_1.Controller)('chat-reactions'),
    __metadata("design:paramtypes", [chat_reactions_service_1.ChatReactionsService])
], ChatReactionsController);
//# sourceMappingURL=chat-reactions.controller.js.map