"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const users_module_1 = require("./modules/users/users.module");
const tournaments_module_1 = require("./modules/tournaments/tournaments.module");
const teams_module_1 = require("./modules/teams/teams.module");
const team_members_module_1 = require("./modules/team-members/team-members.module");
const database_module_1 = require("./database/database.module");
const tasks_module_1 = require("./modules/tasks/tasks.module");
const submissions_module_1 = require("./modules/submissions/submissions.module");
const rounds_module_1 = require("./modules/rounds/rounds.module");
const jury_assignments_module_1 = require("./modules/jury-assignments/jury-assignments.module");
const evaluation_module_1 = require("./modules/evaluation/evaluation.module");
const evaluation_scores_module_1 = require("./modules/evaluation-scores/evaluation-scores.module");
const evaluation_criteria_module_1 = require("./modules/evaluation-criteria/evaluation-criteria.module");
const chat_room_module_1 = require("./modules/chat-room/chat-room.module");
const chat_room_settings_module_1 = require("./modules/chat-room-settings/chat-room-settings.module");
const chat_reactions_module_1 = require("./modules/chat-reactions/chat-reactions.module");
const chat_pinned_module_1 = require("./modules/chat-pinned/chat-pinned.module");
const chat_messages_module_1 = require("./modules/chat-messages/chat-messages.module");
const announcements_module_1 = require("./modules/announcements/announcements.module");
const auth_module_1 = require("./modules/auth/auth.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [users_module_1.UsersModule, tournaments_module_1.TournamentsModule, database_module_1.DatabaseModule, teams_module_1.TeamsModule, team_members_module_1.TeamMembersModule, tasks_module_1.TasksModule, submissions_module_1.SubmissionsModule, rounds_module_1.RoundsModule, jury_assignments_module_1.JuryAssignmentsModule, evaluation_module_1.EvaluationModule, evaluation_scores_module_1.EvaluationScoresModule, evaluation_criteria_module_1.EvaluationCriteriaModule, chat_room_module_1.ChatRoomModule, chat_room_settings_module_1.ChatRoomSettingsModule, chat_reactions_module_1.ChatReactionsModule, chat_pinned_module_1.ChatPinnedModule, chat_messages_module_1.ChatMessagesModule, announcements_module_1.AnnouncementsModule, auth_module_1.AuthModule],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map