import { PUBLIC, ROLE } from '@common/decorators';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const publicValue = this.reflector.get(PUBLIC, context.getHandler());
    if (publicValue) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const roles = this.reflector.getAllAndMerge(ROLE, [
      context.getHandler(),
      context.getClass(),
    ]);
    // 403 (not 401): the user IS authenticated, he just doesn't have the right role.
    // Returning 401 made the frontend think the token was expired and rotate the
    // refresh token on every "wrong role" call.
    if (!user || !roles.includes(user.role)) {
      throw new ForbiddenException(`Forbidden, must be a ${roles}`);
    }
    return true;
  }
}
