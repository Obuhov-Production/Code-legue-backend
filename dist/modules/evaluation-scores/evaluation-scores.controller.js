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
exports.EvaluationScoresController = void 0;
const common_1 = require("@nestjs/common");
const evaluation_scores_service_1 = require("./evaluation-scores.service");
let EvaluationScoresController = class EvaluationScoresController {
    evaluationScoresService;
    constructor(evaluationScoresService) {
        this.evaluationScoresService = evaluationScoresService;
    }
};
exports.EvaluationScoresController = EvaluationScoresController;
exports.EvaluationScoresController = EvaluationScoresController = __decorate([
    (0, common_1.Controller)('evaluation-scores'),
    __metadata("design:paramtypes", [evaluation_scores_service_1.EvaluationScoresService])
], EvaluationScoresController);
//# sourceMappingURL=evaluation-scores.controller.js.map