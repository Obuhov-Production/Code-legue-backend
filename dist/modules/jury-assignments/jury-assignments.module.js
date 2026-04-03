"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JuryAssignmentsModule = void 0;
const common_1 = require("@nestjs/common");
const jury_assignments_service_1 = require("./jury-assignments.service");
const jury_assignments_controller_1 = require("./jury-assignments.controller");
const typeorm_1 = require("@nestjs/typeorm");
const jury_assignment_entity_1 = require("./entities/jury-assignment.entity");
let JuryAssignmentsModule = class JuryAssignmentsModule {
};
exports.JuryAssignmentsModule = JuryAssignmentsModule;
exports.JuryAssignmentsModule = JuryAssignmentsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([jury_assignment_entity_1.JuryAssignment])],
        controllers: [jury_assignments_controller_1.JuryAssignmentsController],
        providers: [jury_assignments_service_1.JuryAssignmentsService],
    })
], JuryAssignmentsModule);
//# sourceMappingURL=jury-assignments.module.js.map