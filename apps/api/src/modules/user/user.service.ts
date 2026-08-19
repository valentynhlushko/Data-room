import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { User } from './types/user.types';
import { USER_ERRORS } from './constants/user.errors';
import { CreateUserDto } from './dto/create.user.dto';
import { UserRepository } from './repositories/user.repository';
import type { SupabaseJwtPayload } from '../auth/types/supabase-jwt';
import { ShareService } from '../share/share.service';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly shareService: ShareService,
  ) {}

  async ensureFromAuth(payload: SupabaseJwtPayload): Promise<User> {
    const dto = this.toCreateUserDto(payload);
    const existing = await this.userRepository.findBySupabaseId(dto.supabaseId);

    if (existing) {
      return existing;
    }

    const user = await this.userRepository.create(dto);
    await this.shareService.claimPendingShares(user.id, user.email);
    return user;
  }

  async syncSession(user: User, payload: SupabaseJwtPayload): Promise<User> {
    const dto = this.toCreateUserDto(payload);
    const synced = await this.updateIfChanged(user, dto);
    await this.shareService.claimPendingShares(synced.id, synced.email);
    return synced;
  }

  private async updateIfChanged(existing: User, dto: CreateUserDto) {
    const hasChanges =
      existing.email !== dto.email ||
      existing.displayName !== (dto.displayName ?? null) ||
      existing.avatarUrl !== (dto.avatarUrl ?? null);

    if (!hasChanges) {
      return existing;
    }

    return this.userRepository.update(existing.id, {
      email: dto.email,
      displayName: dto.displayName,
      avatarUrl: dto.avatarUrl,
    });
  }

  private toCreateUserDto(payload: SupabaseJwtPayload): CreateUserDto {
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException(USER_ERRORS.TOKEN_MISSING_CLAIMS);
    }

    const dto = new CreateUserDto();
    dto.supabaseId = payload.sub;
    dto.email = payload.email;
    dto.displayName =
      payload.user_metadata?.full_name ?? payload.user_metadata?.name;
    dto.avatarUrl =
      payload.user_metadata?.avatar_url ?? payload.user_metadata?.picture;

    return dto;
  }
}
