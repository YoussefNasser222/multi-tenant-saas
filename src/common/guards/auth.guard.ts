import { PUBLIC } from '@common/decorators';
import { SENSITIVE_SELECT } from '@common/constants';
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
    // كاش بسيط في الميموري لبيانات اليوزر عشان نقلل ضغط الداتابيز.
    // ملحوظة: على Vercel (serverless) الكاش ده بيفيد بس وقت الـ warm invocations.
    // ✔ اتغيّر: الكاش دلوقتي مبيخزنش الـ password hash ولا بيانات الـ OTP خالص.
    private static userCache = new Map<string, { user: any; expiresAt: number }>();

    /** بيتنادى بعد أي تعديل إداري (تفعيل اشتراك / حذف) عشان التغيير يظهر فورًا على نفس الـ instance */
    static invalidate(userId?: string | { toString(): string }) {
        if (userId === undefined) {
            AuthGuard.userCache.clear();
            return;
        }
        AuthGuard.userCache.delete(userId.toString());
    }

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
            const payload: { userId: string; email: string; role: Role; type?: string } =
                this.jwtService.verify(token, {
                    secret: this.configService.get('JWT_SECRET'),
                });

            // الـ refresh token متوقعش يتقبل كـ access token (كان بيخلّي مدة الـ 1d ملهاش لازمة).
            // التوكنز القديمة (قبل التعديل) مفيهاش type فبتفضل شغالة لحد ما تتجدد.
            if (payload.type === 'refresh') {
                throw new UnauthorizedException('Invalid token');
            }

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

        // بنستبعد الـ password والـ OTP من اليوزر اللي بيتحط على الـ request وفي الكاش
        const user = await this.userRepo.getOne({ _id: userId }, SENSITIVE_SELECT);
        if (user) {
            AuthGuard.userCache.set(userId, {
                user,
                expiresAt: Date.now() + USER_CACHE_TTL_MS,
            });
            // منع تضخم الميموري في instance طويل العمر
            if (AuthGuard.userCache.size > 5000) {
                const oldest = AuthGuard.userCache.keys().next().value;
                if (oldest) AuthGuard.userCache.delete(oldest);
            }
        }
        return user;
    }
}
