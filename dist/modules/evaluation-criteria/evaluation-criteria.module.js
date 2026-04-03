"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationCriteriaModule = void 0;
const common_1 = require("@nestjs/common");
const evaluation_criteria_service_1 = require("./evaluation-criteria.service");
const evaluation_criteria_controller_1 = require("./evaluation-criteria.controller");
const typeorm_1 = require("@nestjs/typeorm");
const evaluation_criterion_entity_1 = require("./entities/evaluation-criterion.entity");
let EvaluationCriteriaModule = class EvaluationCriteriaModule {
};
exports.EvaluationCriteriaModule = EvaluationCriteriaModule;
exports.EvaluationCriteriaModule = EvaluationCriteriaModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([evaluation_criterion_entity_1.EvaluationCriteria])],
        controllers: [evaluation_criteria_controller_1.EvaluationCriteriaController],
        providers: [evaluation_criteria_service_1.EvaluationCriteriaService],
    })
], EvaluationCriteriaModule);
//# sourceMappingURL=evaluation-criteria.module.js.map