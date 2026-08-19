import { Injectable, NotFoundException } from '@nestjs/common';
import { DATA_ROOM_ERRORS } from '../data-room/constants/data-room.errors';
import { FILE_LIST_DEFAULT_LIMIT } from '../file/constants/file.errors';
import { SHARE_ERRORS, SHARE_RESOURCE_TYPE } from './constants/share.errors';
import { AccessService } from './access.service';
import { ShareRepository } from './repositories/share.repository';
import { StorageService } from '../storage/storage.service';
import type { Folder } from '../folder/types/folder.types';
import type { Share } from './types/share.types';

const PUBLIC_PREVIEW_EXPIRES_IN = 900;

@Injectable()
export class ShareLinkService {
  constructor(
    private readonly shareRepository: ShareRepository,
    private readonly accessService: AccessService,
    private readonly storageService: StorageService,
  ) {}

  async resolve(token: string) {
    const share = await this.requireShare(token);
    const dataRoom = await this.shareRepository.findDataRoom(share.dataRoomId);
    if (!dataRoom) {
      throw new NotFoundException(SHARE_ERRORS.LINK_UNAVAILABLE);
    }

    const rootFolder = await this.shareRepository.findRootFolder(
      share.dataRoomId,
    );
    if (!rootFolder) {
      throw new NotFoundException(DATA_ROOM_ERRORS.ROOT_FOLDER_MISSING);
    }

    if (share.resourceType === SHARE_RESOURCE_TYPE.FILE) {
      const file = await this.shareRepository.findFile(share.resourceId);
      if (!file) {
        throw new NotFoundException(SHARE_ERRORS.LINK_UNAVAILABLE);
      }

      return {
        share: this.toShareSummary(share),
        dataRoom: { id: dataRoom.id, name: dataRoom.name },
        folder: null,
        file: this.toFileSummary(file),
        rootFolderId: null,
      };
    }

    const folderId =
      this.accessService.shareRootFolderId(share, rootFolder.id) ??
      rootFolder.id;
    const folder = await this.shareRepository.findFolder(folderId);
    if (!folder) {
      throw new NotFoundException(SHARE_ERRORS.LINK_UNAVAILABLE);
    }

    return {
      share: this.toShareSummary(share),
      dataRoom: { id: dataRoom.id, name: dataRoom.name },
      folder: this.toFolderSummary(folder),
      file: null,
      rootFolderId: folder.id,
    };
  }

  async getFolderContents(
    token: string,
    folderId: string,
    query: { cursor?: string; limit?: number } = {},
  ) {
    const share = await this.requireShare(token);
    const folder = await this.accessService.assertFolderWithinShare(
      share,
      folderId,
    );
    const clipFrom = this.accessService.shareRootFolderId(
      share,
      (
        await this.shareRepository.findRootFolder(share.dataRoomId)
      )?.id ?? folder.id,
    );

    const [breadcrumbs, folders, filePage] = await Promise.all([
      this.buildBreadcrumbs(folder, clipFrom),
      this.shareRepository.findFolderChildren(folder.id),
      this.shareRepository.findFilesInFolderPage(folder.id, {
        cursor: query.cursor,
        limit: query.limit ?? FILE_LIST_DEFAULT_LIMIT,
      }),
    ]);

    return {
      folder: this.toFolderSummary(folder),
      breadcrumbs,
      folders,
      files: filePage.files,
      nextFileCursor: filePage.nextCursor,
    };
  }

  async getFilePreviewUrl(token: string, fileId: string) {
    const share = await this.requireShare(token);
    const file = await this.accessService.assertFileWithinShare(share, fileId);
    const url = await this.storageService.createSignedUrl(
      file.storageKey,
      PUBLIC_PREVIEW_EXPIRES_IN,
    );

    return {
      url,
      expiresIn: PUBLIC_PREVIEW_EXPIRES_IN,
      file: this.toFileSummary(file),
    };
  }

  private async requireShare(token: string) {
    const share = await this.shareRepository.findActivePublicByToken(token);
    if (!share) {
      throw new NotFoundException(SHARE_ERRORS.LINK_UNAVAILABLE);
    }
    return share;
  }

  private async buildBreadcrumbs(folder: Folder, clipFromId: string | null) {
    const breadcrumbs: { id: string; name: string; isRoot: boolean }[] = [];
    let current: Folder | null = folder;

    while (current) {
      breadcrumbs.unshift({
        id: current.id,
        name: current.name,
        isRoot: current.isRoot,
      });

      if (clipFromId && current.id === clipFromId) {
        break;
      }

      current = current.parentId
        ? await this.shareRepository.findFolder(current.parentId)
        : null;
    }

    return breadcrumbs;
  }

  private toShareSummary(share: Share) {
    return {
      id: share.id,
      resourceType: share.resourceType,
      resourceId: share.resourceId,
      role: share.role,
      kind: share.kind,
    };
  }

  private toFolderSummary(folder: Folder) {
    return {
      id: folder.id,
      name: folder.name,
      isRoot: folder.isRoot,
      parentId: folder.parentId,
      dataRoomId: folder.dataRoomId,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
    };
  }

  private toFileSummary(file: {
    id: string;
    name: string;
    mimeType: string;
    sizeBytes: number;
    folderId: string;
    dataRoomId: string;
    uploadedById: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      folderId: file.folderId,
      dataRoomId: file.dataRoomId,
      uploadedById: file.uploadedById,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
    };
  }
}
