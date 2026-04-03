"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateChatMessageDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_chat_message_dto_1 = require("./create-chat-message.dto");
class UpdateChatMessageDto extends (0, mapped_types_1.PartialType)(create_chat_message_dto_1.CreateChatMessageDto) {
}
exports.UpdateChatMessageDto = UpdateChatMessageDto;
//# sourceMappingURL=update-chat-message.dto.js.map