import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { UserService } from '../../user/user.service';
import { AUTH_ERRORS } from '../constants/auth.errors';
import { SupabaseAuthService } from '../supabase-auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly supabaseAuthService: SupabaseAuthService,
    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException(AUTH_ERRORS.MISSING_BEARER_TOKEN);
    }

    const payload = await this.supabaseAuthService.verifyAccessToken(token);
    request.authPayload = payload;
    request.user = await this.userService.ensureFromAuth(payload);

    return true;
  }

  private extractBearerToken(request: Request): string | null {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' && token ? token : null;
  }
}
