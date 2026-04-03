"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateRoundDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_round_dto_1 = require("./create-round.dto");
class UpdateRoundDto extends (0, mapped_types_1.PartialType)(create_round_dto_1.CreateRoundDto) {
}
exports.UpdateRoundDto = UpdateRoundDto;
//# sourceMappingURL=update-round.dto.js.map