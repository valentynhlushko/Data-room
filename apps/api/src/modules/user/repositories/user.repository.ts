import { Injectable } from '@nestjs/common';
import type { User } from '../types/user.types';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateUserDto } from '../dto/create.user.dto';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  findBySupabaseId(supabaseId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { supabaseId },
    });
  }

  create(data: CreateUserDto): Promise<User> {
    return this.prisma.user.create({
      data: {
        supabaseId: data.supabaseId,
        email: data.email,
        displayName: data.displayName,
        avatarUrl: data.avatarUrl,
      },
    });
  }

  update(id: string, data: Partial<Pick<CreateUserDto, 'email' | 'displayName' | 'avatarUrl'>>): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }
}
