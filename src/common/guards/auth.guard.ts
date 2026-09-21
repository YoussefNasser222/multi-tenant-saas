import { PUBLIC } from '@common/decorators';
import { Role, UserRepository } from '@models/index';
import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';

const USER_CACHE_TTL_MS = 30_000; // 30 ثانية

@Injectable()
export class AuthGuard implements CanActivate {
    // كاش بسيط في الميموري لبيانات اليوزر عشان نقلل ضغط الداتابيز
    // لما نفس اليوزر يعمل أكتر من request قريبين من بعض.
    // ملحوظة: لو السيرفر شغال على بيئة serverless (زي Vercel)، الكاش ده هيفيد
    // بس وقت الـ warm invocations، مش ضمان يشتغل على كل طلب. لو عايز حل مضمون
    // 100%، الأنسب Redis (مثلاً Upstash) بدل الميموري المحلية.
    private static userCache = new Map<string, { user: any; expiresAt: number }>();

    constructor(
        private readonly userRepo: UserRepository,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly reflector: Reflector,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const publicValue = this.reflector.get(PUBLIC, context.getHandler());
        if (publicValue) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const authHeader: string | undefined = request.headers.authorization;

        if (!authHeader) {
            throw new UnauthorizedException('Token is required');
        }

        const [scheme, tokenPart] = authHeader.split(' ');
        const token =
            scheme?.toLowerCase() === 'bearer' && tokenPart ? tokenPart : authHeader;

        try {
            const payload: { userId: string; email: string; role: Role } =
                this.jwtService.verify(token, {
                    secret: this.configService.get('JWT_SECRET'),
                });

            const user = await this.getUser(payload.userId);
            if (!user) {
                throw new UnauthorizedException('User not found');
            }
            request.user = user;
            return true;
        } catch (error: any) {
            if (error instanceof UnauthorizedException) {
                throw error;
            }
            throw new UnauthorizedException(
                error?.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token',
            );
        }
    }

    private async getUser(userId: string) {
        const cached = AuthGuard.userCache.get(userId);
        if (cached && cached.expiresAt > Date.now()) {
            return cached.user;
        }

        const user = await this.userRepo.getOne({ _id: userId });
        if (user) {
            AuthGuard.userCache.set(userId, {
                user,
                expiresAt: Date.now() + USER_CACHE_TTL_MS,
            });
        }
        return user;
    }
}