import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import type { User } from '../../user/types/user.types';
import {
  SHARE_KIND,
  type ShareKind,
  type ShareResourceType,
} from '../constants/share.errors';
import type { Share } from '../types/share.types';

const shareWithGrantee = {
  id: true,
  dataRoomId: true,
  resourceType: true,
  resourceId: true,
  kind: true,
  token: true,
  granteeUserId: true,
  granteeEmail: true,
  role: true,
  createdById: true,
  revokedAt: true,
  createdAt: true,
  updatedAt: true,
  grantee: {
    select: {
      id: true,
      email: true,
      displayName: true,
      avatarUrl: true,
    },
  },
} as const;

export type ShareWithGrantee = Share & {
  grantee: Pick<User, 'id' | 'email' | 'displayName' | 'avatarUrl'> | null;
};

@Injectable()
export class ShareRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<Share | null> {
    return this.prisma.share.findUnique({
      where: { id },
    });
  }

  findActivePublicByToken(token: string): Promise<Share | null> {
    return this.prisma.share.findFirst({
      where: {
        token,
        kind: SHARE_KIND.PUBLIC_LINK,
        revokedAt: null,
      },
    });
  }

  findActivePublic(resourceType: ShareResourceType, resourceId: string) {
    return this.prisma.share.findFirst({
      where: {
        resourceType,
        resourceId,
        kind: SHARE_KIND.PUBLIC_LINK,
        revokedAt: null,
      },
      select: shareWithGrantee,
    });
  }

  findActiveUsers(resourceType: ShareResourceType, resourceId: string) {
    return this.prisma.share.findMany({
      where: {
        resourceType,
        resourceId,
        kind: SHARE_KIND.USER,
        revokedAt: null,
      },
      select: shareWithGrantee,
      orderBy: { createdAt: 'asc' },
    });
  }

  findActiveUserByEmail(
    resourceType: ShareResourceType,
    resourceId: string,
    email: string,
  ) {
    return this.prisma.share.findFirst({
      where: {
        resourceType,
        resourceId,
        kind: SHARE_KIND.USER,
        revokedAt: null,
        granteeEmail: { equals: email, mode: 'insensitive' },
      },
    });
  }

  findActiveMatching(input: {
    userId: string;
    email: string;
    resources: { resourceType: ShareResourceType; resourceId: string }[];
  }): Promise<Share[]> {
    if (input.resources.length === 0) {
      return Promise.resolve([]);
    }

    return this.prisma.share.findMany({
      where: {
        kind: SHARE_KIND.USER,
        revokedAt: null,
        OR: [
          { granteeUserId: input.userId },
          { granteeEmail: { equals: input.email, mode: 'insensitive' } },
        ],
        AND: {
          OR: input.resources.map((resource) => ({
            resourceType: resource.resourceType,
            resourceId: resource.resourceId,
          })),
        },
      },
    });
  }

  findInbox(userId: string, email: string) {
    return this.prisma.share.findMany({
      where: {
        kind: SHARE_KIND.USER,
        revokedAt: null,
        OR: [
          { granteeUserId: userId },
          { granteeEmail: { equals: email, mode: 'insensitive' } },
        ],
      },
      select: shareWithGrantee,
      orderBy: { createdAt: 'desc' },
    });
  }

  create(data: {
    dataRoomId: string;
    resourceType: ShareResourceType;
    resourceId: string;
    kind: ShareKind;
    token?: string;
    granteeUserId?: string;
    granteeEmail?: string;
    createdById: string;
  }) {
    return this.prisma.share.create({
      data,
      select: shareWithGrantee,
    });
  }

  revoke(id: string) {
    return this.prisma.share.update({
      where: { id },
      data: { revokedAt: new Date() },
      select: shareWithGrantee,
    });
  }

  revokeActivePublic(resourceType: ShareResourceType, resourceId: string) {
    return this.prisma.share.updateMany({
      where: {
        resourceType,
        resourceId,
        kind: SHARE_KIND.PUBLIC_LINK,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }

  claimPendingByEmail(userId: string, email: string) {
    return this.prisma.share.updateMany({
      where: {
        kind: SHARE_KIND.USER,
        revokedAt: null,
        granteeUserId: null,
        granteeEmail: { equals: email, mode: 'insensitive' },
      },
      data: { granteeUserId: userId },
    });
  }

  deleteManyForResources(
    resources: { resourceType: ShareResourceType; resourceId: string }[],
  ) {
    if (resources.length === 0) {
      return Promise.resolve({ count: 0 });
    }

    return this.prisma.share.deleteMany({
      where: {
        OR: resources.map((resource) => ({
          resourceType: resource.resourceType,
          resourceId: resource.resourceId,
        })),
      },
    });
  }

  findUsersByEmails(emails: string[]) {
    if (emails.length === 0) {
      return Promise.resolve<{ id: string; email: string }[]>([]);
    }

    return this.prisma.user.findMany({
      where: {
        OR: emails.map((email) => ({
          email: { equals: email, mode: 'insensitive' },
        })),
      },
      select: { id: true, email: true },
    });
  }

  findUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true },
    });
  }

  findDataRoom(id: string) {
    return this.prisma.dataRoom.findUnique({
      where: { id },
      select: { id: true, name: true, ownerId: true },
    });
  }

  findFolder(id: string) {
    return this.prisma.folder.findUnique({
      where: { id },
    });
  }

  findFile(id: string) {
    return this.prisma.file.findUnique({
      where: { id },
    });
  }

  findRootFolder(dataRoomId: string) {
    return this.prisma.folder.findFirst({
      where: { dataRoomId, isRoot: true },
    });
  }

  findFolderChildren(parentId: string) {
    return this.prisma.folder.findMany({
      where: { parentId, isRoot: false },
      select: {
        id: true,
        name: true,
        isRoot: true,
        parentId: true,
        dataRoomId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findFilesInFolderPage(
    folderId: string,
    options: { cursor?: string; limit: number },
  ) {
    const fileSelect = {
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

    let afterName: string | undefined;

    if (options.cursor) {
      const cursorFile = await this.prisma.file.findFirst({
        where: { id: options.cursor, folderId },
        select: { name: true },
      });

      if (!cursorFile) {
        return { files: [], nextCursor: null as string | null };
      }

      afterName = cursorFile.name;
    }

    const rows = await this.prisma.file.findMany({
      where: {
        folderId,
        ...(afterName ? { name: { gt: afterName } } : {}),
      },
      select: fileSelect,
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

  async findAncestorFolderIds(folderId: string): Promise<string[]> {
    const rows = await this.prisma.$queryRaw<{ id: string }[]>`
      WITH RECURSIVE chain AS (
        SELECT id, parent_id, 0 AS depth FROM folders WHERE id = ${folderId}
        UNION ALL
        SELECT f.id, f.parent_id, c.depth + 1 FROM folders f
        INNER JOIN chain c ON f.id = c.parent_id
      )
      SELECT id FROM chain ORDER BY depth ASC
    `;

    return rows.map((row) => row.id);
  }

  async isFolderInSubtree(
    rootFolderId: string,
    folderId: string,
  ): Promise<boolean> {
    const rows = await this.prisma.$queryRaw<{ id: string }[]>`
      WITH RECURSIVE tree AS (
        SELECT id FROM folders WHERE id = ${rootFolderId}
        UNION ALL
        SELECT f.id FROM folders f
        INNER JOIN tree t ON f.parent_id = t.id
      )
      SELECT id FROM tree WHERE id = ${folderId}
    `;

    return rows.length > 0;
  }

  async findSubtreeFolderAndFileIds(folderId: string): Promise<{
    folderIds: string[];
    fileIds: string[];
  }> {
    const folders = await this.prisma.$queryRaw<{ id: string }[]>`
      WITH RECURSIVE tree AS (
        SELECT id FROM folders WHERE id = ${folderId}
        UNION ALL
        SELECT f.id FROM folders f
        INNER JOIN tree t ON f.parent_id = t.id
      )
      SELECT id FROM tree
    `;
    const folderIds = folders.map((row) => row.id);

    if (folderIds.length === 0) {
      return { folderIds: [], fileIds: [] };
    }

    const files = await this.prisma.file.findMany({
      where: { folderId: { in: folderIds } },
      select: { id: true },
    });

    return {
      folderIds,
      fileIds: files.map((file) => file.id),
    };
  }
}
