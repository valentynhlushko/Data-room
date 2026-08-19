import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

const SEARCH_TAKE = 15;

const folderHit = {
  id: true,
  name: true,
  isRoot: true,
  parentId: true,
  dataRoomId: true,
} as const;

const fileHit = {
  id: true,
  name: true,
  folderId: true,
  dataRoomId: true,
} as const;

@Injectable()
export class SearchRepository {
  constructor(private readonly prisma: PrismaService) {}

  searchFolders(input: {
    query: string;
    dataRoomIds: string[];
    folderIds: string[];
  }) {
    const scope = this.folderScope(input.dataRoomIds, input.folderIds);
    if (!scope) {
      return Promise.resolve([]);
    }

    return this.prisma.folder.findMany({
      where: {
        isRoot: false,
        name: { contains: input.query, mode: 'insensitive' },
        OR: scope,
      },
      select: folderHit,
      orderBy: { name: 'asc' },
      take: SEARCH_TAKE,
    });
  }

  searchFiles(input: {
    query: string;
    dataRoomIds: string[];
    folderIds: string[];
    fileIds: string[];
  }) {
    const scope = this.fileScope(
      input.dataRoomIds,
      input.folderIds,
      input.fileIds,
    );
    if (!scope) {
      return Promise.resolve([]);
    }

    return this.prisma.file.findMany({
      where: {
        name: { contains: input.query, mode: 'insensitive' },
        OR: scope,
      },
      select: fileHit,
      orderBy: { name: 'asc' },
      take: SEARCH_TAKE,
    });
  }

  private folderScope(dataRoomIds: string[], folderIds: string[]) {
    const or: Array<{ dataRoomId?: { in: string[] }; id?: { in: string[] } }> =
      [];

    if (dataRoomIds.length > 0) {
      or.push({ dataRoomId: { in: dataRoomIds } });
    }
    if (folderIds.length > 0) {
      or.push({ id: { in: folderIds } });
    }

    return or.length > 0 ? or : null;
  }

  private fileScope(
    dataRoomIds: string[],
    folderIds: string[],
    fileIds: string[],
  ) {
    const or: Array<{
      dataRoomId?: { in: string[] };
      folderId?: { in: string[] };
      id?: { in: string[] };
    }> = [];

    if (dataRoomIds.length > 0) {
      or.push({ dataRoomId: { in: dataRoomIds } });
    }
    if (folderIds.length > 0) {
      or.push({ folderId: { in: folderIds } });
    }
    if (fileIds.length > 0) {
      or.push({ id: { in: fileIds } });
    }

    return or.length > 0 ? or : null;
  }
}
