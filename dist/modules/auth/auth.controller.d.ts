import { AuthService } from './auth.service';
import { CreateUserDto } from "./dto/create-user.dto";
import { LoginUserDto } from "./dto/login-user.dto";
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    create(dto: CreateUserDto): Promise<{
        user: {
            id: number;
            username: string;
            email: string;
            role: import("../users/enums/UserRole.enum").UserRole;
            user_description: string;
            user_avatar_url: string;
            banner_color: string;
            banner_url: string;
            is_chat_muted: boolean;
            created_at: Date;
            username_updated_at: Date;
            tournaments: import("../tournaments/entities/tournament.entity").Tournament[];
            captained_teams: import("../teams/entities/team.entity").Team[];
            juryAssignments: import("../jury-assignments/entities/jury-assignment.entity").JuryAssignment[];
            evaluations: import("../evaluation/entities/evaluation.entity").Evaluation[];
            createdRooms: import("../chat-room/entities/chat-room.entity").ChatRoom[];
            chatReactions: import("../chat-reactions/entities/chat-reaction.entity").ChatReaction[];
            pinnedMessages: import("../chat-pinned/entities/chat-pinned.entity").ChatPinned[];
            messages: import("../chat-messages/entities/chat-message.entity").Message[];
        };
        accessToken: string;
        refreshToken: string;
    }>;
    login(dto: LoginUserDto): Promise<{
        user: {
            id: number;
            username: string;
            email: string;
            role: import("../users/enums/UserRole.enum").UserRole;
            user_description: string;
            user_avatar_url: string;
            banner_color: string;
            banner_url: string;
            is_chat_muted: boolean;
            created_at: Date;
            username_updated_at: Date;
            tournaments: import("../tournaments/entities/tournament.entity").Tournament[];
            captained_teams: import("../teams/entities/team.entity").Team[];
            juryAssignments: import("../jury-assignments/entities/jury-assignment.entity").JuryAssignment[];
            evaluations: import("../evaluation/entities/evaluation.entity").Evaluation[];
            createdRooms: import("../chat-room/entities/chat-room.entity").ChatRoom[];
            chatReactions: import("../chat-reactions/entities/chat-reaction.entity").ChatReaction[];
            pinnedMessages: import("../chat-pinned/entities/chat-pinned.entity").ChatPinned[];
            messages: import("../chat-messages/entities/chat-message.entity").Message[];
        };
        accessToken: string;
        refreshToken: string;
    }>;
}
