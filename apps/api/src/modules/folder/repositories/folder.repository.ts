import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import type { Folder } from '../types/folder.types';

const folderSummary = {
  id: true,
  name: true,
  isRoot: true,
  parentId: true,
  dataRoomId: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class FolderRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<Folder | null> {
    return this.prisma.folder.findUnique({
      where: { id },
    });
  }

  findRootByDataRoomId(dataRoomId: string): Promise<Folder | null> {
    return this.prisma.folder.findFirst({
      where: { dataRoomId, isRoot: true },
    });
  }

  async findDataRoomOwnerId(dataRoomId: string): Promise<string | null> {
    const dataRoom = await this.findDataRoomMeta(dataRoomId);
    return dataRoom?.ownerId ?? null;
  }

  findDataRoomMeta(dataRoomId: string) {
    return this.prisma.dataRoom.findUnique({
      where: { id: dataRoomId },
      select: { id: true, name: true, ownerId: true },
    });
  }

  findChildren(parentId: string) {
    return this.prisma.folder.findMany({
      where: { parentId, isRoot: false },
      select: folderSummary,
      orderBy: { name: 'asc' },
    });
  }

  findSiblingByName(parentId: string, name: string, excludeId?: string) {
    return this.prisma.folder.findFirst({
      where: {
        parentId,
        name,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  }

  create(data: {
    name: string;
    dataRoomId: string;
    parentId: string;
    createdById: string;
  }) {
    return this.prisma.folder.create({
      data: {
        name: data.name,
        dataRoomId: data.dataRoomId,
        parentId: data.parentId,
        createdById: data.createdById,
        isRoot: false,
      },
      select: folderSummary,
    });
  }

  updateName(id: string, name: string) {
    return this.prisma.folder.update({
      where: { id },
      data: { name },
      select: folderSummary,
    });
  }

  deleteById(id: string) {
    return this.prisma.folder.delete({
      where: { id },
    });
  }

  async countDescendants(id: string): Promise<number> {
    const rows = await this.prisma.$queryRaw<[{ count: bigint }]>`
      WITH RECURSIVE tree AS (
        SELECT id FROM folders WHERE parent_id = ${id}
        UNION ALL
        SELECT f.id FROM folders f
        INNER JOIN tree t ON f.parent_id = t.id
      )
      SELECT COUNT(*)::bigint AS count FROM tree
    `;

    return Number(rows[0]?.count ?? 0);
  }
}
