import { randomBytes } from 'node:crypto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SHARE_ERRORS, SHARE_KIND, SHARE_RESOURCE_TYPE, type ShareResourceType } from './constants/share.errors';
import { AccessService } from './access.service';
import { ShareRepository } from './repositories/share.repository';
import type { ShareWithGrantee } from './repositories/share.repository';

@Injectable()
export class ShareService {
  constructor(
    private readonly shareRepository: ShareRepository,
    private readonly accessService: AccessService,
  ) {}

  async listForResource(
    userId: string,
    resourceType: ShareResourceType,
    resourceId: string,
  ) {
    await this.accessService.resolveOwnedResource(
      userId,
      resourceType,
      resourceId,
    );

    const [publicLink, users] = await Promise.all([
      this.shareRepository.findActivePublic(resourceType, resourceId),
      this.shareRepository.findActiveUsers(resourceType, resourceId),
    ]);

    return {
      publicLink: publicLink
        ? {
            enabled: true,
            token: publicLink.token,
            createdAt: publicLink.createdAt,
          }
        : { enabled: false, token: null, createdAt: null },
      users: users.map((share) => this.toUserShare(share)),
    };
  }

  async inbox(userId: string, email: string) {
    const shares = await this.shareRepository.findInbox(userId, email);

    return Promise.all(shares.map((share) => this.toInboxItem(share)));
  }

  async inviteUsers(
    userId: string,
    input: {
      resourceType: ShareResourceType;
      resourceId: string;
      emails: string[];
    },
  ) {
    const resource = await this.accessService.resolveOwnedResource(
      userId,
      input.resourceType,
      input.resourceId,
    );
    const owner = await this.shareRepository.findUserById(userId);
    const created: ReturnType<ShareService['toUserShare']>[] = [];
    const skipped: string[] = [];

    const uniqueEmails = [
      ...new Set(input.emails.map((email) => email.trim().toLowerCase())),
    ];
    const users = await this.shareRepository.findUsersByEmails(uniqueEmails);
    const usersByEmail = new Map(
      users.map((user) => [user.email.toLowerCase(), user] as const),
    );
    const missing = uniqueEmails.filter((email) => !usersByEmail.has(email));

    if (missing.length > 0) {
      throw new BadRequestException(SHARE_ERRORS.USER_NOT_FOUND(missing));
    }

    for (const email of uniqueEmails) {
      const grantee = usersByEmail.get(email);
      if (!grantee) {
        throw new BadRequestException(SHARE_ERRORS.USER_NOT_FOUND([email]));
      }

      if (owner && owner.email.toLowerCase() === email) {
        skipped.push(email);
        continue;
      }

      const existing = await this.shareRepository.findActiveUserByEmail(
        input.resourceType,
        input.resourceId,
        email,
      );
      if (existing) {
        skipped.push(email);
        continue;
      }

      const share = await this.shareRepository.create({
        dataRoomId: resource.dataRoomId,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        kind: SHARE_KIND.USER,
        granteeEmail: email,
        granteeUserId: grantee.id,
        createdById: userId,
      });
      created.push(this.toUserShare(share));
    }

    return { created, skipped };
  }

  async setPublicLink(
    userId: string,
    input: {
      resourceType: ShareResourceType;
      resourceId: string;
      enabled: boolean;
    },
  ) {
    const resource = await this.accessService.resolveOwnedResource(
      userId,
      input.resourceType,
      input.resourceId,
    );

    if (!input.enabled) {
      await this.shareRepository.revokeActivePublic(
        input.resourceType,
        input.resourceId,
      );
      return { enabled: false, token: null, createdAt: null };
    }

    const existing = await this.shareRepository.findActivePublic(
      input.resourceType,
      input.resourceId,
    );
    if (existing?.token) {
      return {
        enabled: true,
        token: existing.token,
        createdAt: existing.createdAt,
      };
    }

    const created = await this.shareRepository.create({
      dataRoomId: resource.dataRoomId,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      kind: SHARE_KIND.PUBLIC_LINK,
      token: randomBytes(32).toString('base64url'),
      createdById: userId,
    });

    return {
      enabled: true,
      token: created.token,
      createdAt: created.createdAt,
    };
  }

  async revoke(userId: string, shareId: string) {
    const share = await this.shareRepository.findById(shareId);
    if (!share || share.revokedAt) {
      throw new NotFoundException(SHARE_ERRORS.NOT_FOUND);
    }

    await this.accessService.assertCanManage(userId, {
      resourceType: share.resourceType,
      resourceId: share.resourceId,
      dataRoomId: share.dataRoomId,
    });

    return this.toUserShare(await this.shareRepository.revoke(share.id));
  }

  claimPendingShares(userId: string, email: string) {
    return this.shareRepository.claimPendingByEmail(userId, email);
  }

  async deleteSharesForFolder(folderId: string) {
    const { folderIds, fileIds } =
      await this.shareRepository.findSubtreeFolderAndFileIds(folderId);
    const resources = [
      ...folderIds.map((id) => ({
        resourceType: SHARE_RESOURCE_TYPE.FOLDER,
        resourceId: id,
      })),
      ...fileIds.map((id) => ({
        resourceType: SHARE_RESOURCE_TYPE.FILE,
        resourceId: id,
      })),
    ];
    await this.shareRepository.deleteManyForResources(resources);
  }

  async deleteSharesForFile(fileId: string) {
    await this.shareRepository.deleteManyForResources([
      { resourceType: SHARE_RESOURCE_TYPE.FILE, resourceId: fileId },
    ]);
  }

  private toUserShare(share: ShareWithGrantee) {
    return {
      id: share.id,
      email: share.grantee?.email ?? share.granteeEmail,
      displayName: share.grantee?.displayName ?? null,
      avatarUrl: share.grantee?.avatarUrl ?? null,
      role: share.role,
      createdAt: share.createdAt,
    };
  }

  private async toInboxItem(share: ShareWithGrantee) {
    const dataRoom = await this.shareRepository.findDataRoom(share.dataRoomId);
    let name = dataRoom?.name ?? 'Shared item';
    let openFolderId: string | null = null;
    let fileId: string | null = null;

    if (share.resourceType === SHARE_RESOURCE_TYPE.DATA_ROOM) {
      const root = await this.shareRepository.findRootFolder(share.dataRoomId);
      openFolderId = root?.id ?? null;
    } else if (share.resourceType === SHARE_RESOURCE_TYPE.FOLDER) {
      const folder = await this.shareRepository.findFolder(share.resourceId);
      name = folder?.name ?? name;
      openFolderId = folder?.id ?? null;
    } else if (share.resourceType === SHARE_RESOURCE_TYPE.FILE) {
      const file = await this.shareRepository.findFile(share.resourceId);
      name = file?.name ?? name;
      openFolderId = file?.folderId ?? null;
      fileId = file?.id ?? null;
    }

    return {
      id: share.id,
      resourceType: share.resourceType,
      resourceId: share.resourceId,
      dataRoomId: share.dataRoomId,
      role: share.role,
      name,
      openFolderId,
      fileId,
      createdAt: share.createdAt,
    };
  }
}
