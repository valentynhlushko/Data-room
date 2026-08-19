import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { decode, verify, type JwtPayload } from 'jsonwebtoken';
import { AUTH_ERRORS } from './constants/auth.errors';
import type { SupabaseJwtPayload } from './types/supabase-jwt';

type SupabaseUserResponse = {
  id?: string;
  email?: string;
  user_metadata?: SupabaseJwtPayload['user_metadata'];
};

@Injectable()
export class SupabaseAuthService {
  private readonly jwtSecret: string | null;
  private readonly supabaseUrl: string | null;
  private readonly anonKey: string | null;

  constructor(configService: ConfigService) {
    this.jwtSecret =
      configService.get<string>('SUPABASE_JWT_SECRET')?.trim() || null;
    this.supabaseUrl = configService.get<string>('SUPABASE_URL')?.trim() || null;
    this.anonKey =
      configService.get<string>('SUPABASE_ANON_KEY')?.trim() || null;
  }

  async verifyAccessToken(token: string): Promise<SupabaseJwtPayload> {
    const alg = this.peekAlg(token);

    if (alg === 'HS256' && this.jwtSecret) {
      return this.verifyLocal(token);
    }

    return this.verifyRemote(token);
  }

  private peekAlg(token: string): string | null {
    const decoded = decode(token, { complete: true });
    const alg = decoded?.header?.alg;
    return typeof alg === 'string' ? alg : null;
  }

  private verifyLocal(token: string): SupabaseJwtPayload {
    let decoded: JwtPayload;

    try {
      decoded = verify(token, this.jwtSecret!, {
        algorithms: ['HS256'],
      }) as JwtPayload;
    } catch {
      throw new UnauthorizedException(AUTH_ERRORS.INVALID_ACCESS_TOKEN);
    }

    return this.toPayload(
      decoded.sub,
      typeof decoded.email === 'string' ? decoded.email : undefined,
      decoded.user_metadata as SupabaseJwtPayload['user_metadata'] | undefined,
    );
  }

  private async verifyRemote(token: string): Promise<SupabaseJwtPayload> {
    if (!this.supabaseUrl || !this.anonKey) {
      throw new UnauthorizedException(AUTH_ERRORS.INVALID_ACCESS_TOKEN);
    }

    const response = await fetch(`${this.supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: this.anonKey,
      },
    });

    if (!response.ok) {
      throw new UnauthorizedException(AUTH_ERRORS.INVALID_ACCESS_TOKEN);
    }

    const user = (await response.json()) as SupabaseUserResponse;
    return this.toPayload(user.id, user.email, user.user_metadata);
  }

  private toPayload(
    sub: string | undefined,
    email: string | undefined,
    userMetadata: SupabaseJwtPayload['user_metadata'],
  ): SupabaseJwtPayload {
    if (!sub || !email) {
      throw new UnauthorizedException(AUTH_ERRORS.INVALID_ACCESS_TOKEN);
    }

    return {
      sub,
      email,
      user_metadata: userMetadata,
    };
  }
}
