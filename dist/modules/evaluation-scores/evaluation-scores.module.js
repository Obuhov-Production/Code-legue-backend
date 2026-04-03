"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationScoresModule = void 0;
const common_1 = require("@nestjs/common");
const evaluation_scores_service_1 = require("./evaluation-scores.service");
const evaluation_scores_controller_1 = require("./evaluation-scores.controller");
const typeorm_1 = require("@nestjs/typeorm");
const evaluation_score_entity_1 = require("./entities/evaluation-score.entity");
let EvaluationScoresModule = class EvaluationScoresModule {
};
exports.EvaluationScoresModule = EvaluationScoresModule;
exports.EvaluationScoresModule = EvaluationScoresModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([evaluation_score_entity_1.EvaluationScore])],
        controllers: [evaluation_scores_controller_1.EvaluationScoresController],
        providers: [evaluation_scores_service_1.EvaluationScoresService],
    })
], EvaluationScoresModule);
//# sourceMappingURL=evaluation-scores.module.js.map