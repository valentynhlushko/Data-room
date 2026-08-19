import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import type { FileRecord } from '../types/file.types';
import type { Folder } from '../../folder/types/folder.types';

const fileSummary = {
  id: true,
  name: true,
  mimeType: true,
  sizeBytes: true,
  folderId: true,
  dataRoomId: true,
  uploadedById: true,
  createdAt: true,
  updatedAt: true,
} as const;

export type FileSummary = Pick<
  FileRecord,
  | 'id'
  | 'name'
  | 'mimeType'
  | 'sizeBytes'
  | 'folderId'
  | 'dataRoomId'
  | 'uploadedById'
  | 'createdAt'
  | 'updatedAt'
>;

@Injectable()
export class FileRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<FileRecord | null> {
    return this.prisma.file.findUnique({
      where: { id },
    });
  }

  async findPageByFolderId(
    folderId: string,
    options: { cursor?: string; limit: number },
  ): Promise<{ files: FileSummary[]; nextCursor: string | null }> {
    let afterName: string | undefined;

    if (options.cursor) {
      const cursorFile = await this.prisma.file.findFirst({
        where: { id: options.cursor, folderId },
        select: { name: true },
      });

      if (!cursorFile) {
        return { files: [], nextCursor: null };
      }

      afterName = cursorFile.name;
    }

    const rows = await this.prisma.file.findMany({
      where: {
        folderId,
        ...(afterName ? { name: { gt: afterName } } : {}),
      },
      select: fileSummary,
      orderBy: { name: 'asc' },
      take: options.limit + 1,
    });

    const hasMore = rows.length > options.limit;
    const files = hasMore ? rows.slice(0, options.limit) : rows;

    return {
      files,
      nextCursor: hasMore ? (files[files.length - 1]?.id ?? null) : null,
    };
  }

  findNamesInFolder(folderId: string): Promise<{ name: string }[]> {
    return this.prisma.file.findMany({
      where: { folderId },
      select: { name: true },
    });
  }

  findSiblingByName(folderId: string, name: string, excludeId?: string) {
    return this.prisma.file.findFirst({
      where: {
        folderId,
        name,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  }

  findOwnedFolder(folderId: string, userId: string): Promise<Folder | null> {
    return this.prisma.folder.findFirst({
      where: {
        id: folderId,
        dataRoom: { ownerId: userId },
      },
    });
  }

  create(data: {
    id: string;
    name: string;
    mimeType: string;
    sizeBytes: number;
    storageKey: string;
    folderId: string;
    dataRoomId: string;
    uploadedById: string;
  }) {
    return this.prisma.file.create({
      data,
      select: fileSummary,
    });
  }

  update(
    id: string,
    data: {
      name?: string;
      folderId?: string;
    },
  ) {
    return this.prisma.file.update({
      where: { id },
      data,
      select: fileSummary,
    });
  }

  deleteById(id: string) {
    return this.prisma.file.delete({
      where: { id },
    });
  }

  async countInSubtree(folderId: string): Promise<number> {
    const rows = await this.prisma.$queryRaw<[{ count: bigint }]>`
      WITH RECURSIVE tree AS (
        SELECT id FROM folders WHERE id = ${folderId}
        UNION ALL
        SELECT f.id FROM folders f
        INNER JOIN tree t ON f.parent_id = t.id
      )
      SELECT COUNT(*)::bigint AS count FROM files WHERE folder_id IN (SELECT id FROM tree)
    `;

    return Number(rows[0]?.count ?? 0);
  }

  async findStorageKeysInSubtree(folderId: string): Promise<string[]> {
    const rows = await this.prisma.$queryRaw<{ storage_key: string }[]>`
      WITH RECURSIVE tree AS (
        SELECT id FROM folders WHERE id = ${folderId}
        UNION ALL
        SELECT f.id FROM folders f
        INNER JOIN tree t ON f.parent_id = t.id
      )
      SELECT storage_key FROM files WHERE folder_id IN (SELECT id FROM tree)
    `;

    return rows.map((row) => row.storage_key);
  }
}
