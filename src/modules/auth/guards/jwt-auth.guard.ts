import { ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

const BANNED_ALLOWED_PATHS = ['/api/users/me', '/api/users/me/email', '/api/auth/refresh', '/api/auth/logout'];

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const result = await super.canActivate(context);
        if (!result) return false;

        const req = context.switchToHttp().getRequest();
        const user = req.user;
        if (user?.role?.includes('banned')) {
            const path: string = req.path || '';
            const allowed = BANNED_ALLOWED_PATHS.some((p) => path === p || path.startsWith(p + '/'));
            if (!allowed) {
                throw new ForbiddenException('Акаунт заблоковано');
            }
        }

        return true;
    }
}