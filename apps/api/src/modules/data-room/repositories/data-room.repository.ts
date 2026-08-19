import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import type { DataRoom } from '../types/data-room.types';

@Injectable()
export class DataRoomRepository {
  constructor(private readonly prisma: PrismaService) {}

  findFirstByOwnerId(ownerId: string): Promise<DataRoom | null> {
    return this.prisma.dataRoom.findFirst({
      where: { ownerId },
      orderBy: { createdAt: 'asc' },
    });
  }

  createWithRootFolder(ownerId: string): Promise<DataRoom> {
    return this.prisma.dataRoom.create({
      data: {
        ownerId,
        folders: {
          create: {
            name: 'Root',
            isRoot: true,
            createdById: ownerId,
          },
        },
      },
    });
  }
}
