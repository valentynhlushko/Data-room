import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { FOLDER_ERRORS } from '../folder/constants/folder.errors';
import { FILE_ERRORS } from '../file/constants/file.errors';
import { DATA_ROOM_ERRORS } from '../data-room/constants/data-room.errors';
import {
  SHARE_ERRORS,
  SHARE_RESOURCE_TYPE,
  type ShareResourceType,
} from './constants/share.errors';
import { ShareRepository } from './repositories/share.repository';
import type { Folder } from '../folder/types/folder.types';
import type { FileRecord } from '../file/types/file.types';
import type { Share } from './types/share.types';

export type ResourceRef = {
  resourceType: ShareResourceType;
  resourceId: string;
  dataRoomId: string;
};

@Injectable()
export class AccessService {
  constructor(private readonly shareRepository: ShareRepository) {}

  async assertCanManage(userId: string, resource: ResourceRef) {
    const dataRoom = await this.shareRepository.findDataRoom(resource.dataRoomId);

    if (!dataRoom) {
      throw new NotFoundException(this.notFoundMessage(resource.resourceType));
    }

    if (dataRoom.ownerId !== userId) {
      throw new ForbiddenException(SHARE_ERRORS.FORBIDDEN);
    }

    return dataRoom;
  }

  async resolveOwnedResource(
    userId: string,
    resourceType: ShareResourceType,
    resourceId: string,
  ): Promise<ResourceRef> {
    const resource = await this.loadResource(resourceType, resourceId);
    await this.assertCanManage(userId, resource);
    return resource;
  }

  async assertCanViewFolder(userId: string, folder: Folder): Promise<void> {
    if (await this.canViewFolder(userId, folder)) {
      return;
    }

    throw new ForbiddenException(FOLDER_ERRORS.FORBIDDEN);
  }

  async assertCanViewFile(userId: string, file: FileRecord): Promise<void> {
    if (await this.canViewFile(userId, file)) {
      return;
    }

    throw new ForbiddenException(FILE_ERRORS.FORBIDDEN);
  }

  async canViewFolder(userId: string, folder: Folder): Promise<boolean> {
    const dataRoom = await this.shareRepository.findDataRoom(folder.dataRoomId);
    if (dataRoom?.ownerId === userId) {
      return true;
    }

    const ancestorIds = await this.shareRepository.findAncestorFolderIds(
      folder.id,
    );
    const shares = await this.findUserShares(userId, [
      {
        resourceType: SHARE_RESOURCE_TYPE.DATA_ROOM,
        resourceId: folder.dataRoomId,
      },
      ...ancestorIds.map((id) => ({
        resourceType: SHARE_RESOURCE_TYPE.FOLDER,
        resourceId: id,
      })),
    ]);

    return shares.length > 0;
  }

  async canViewFile(userId: string, file: FileRecord): Promise<boolean> {
    const dataRoom = await this.shareRepository.findDataRoom(file.dataRoomId);
    if (dataRoom?.ownerId === userId) {
      return true;
    }

    const ancestorIds = await this.shareRepository.findAncestorFolderIds(
      file.folderId,
    );
    const shares = await this.findUserShares(userId, [
      {
        resourceType: SHARE_RESOURCE_TYPE.DATA_ROOM,
        resourceId: file.dataRoomId,
      },
      {
        resourceType: SHARE_RESOURCE_TYPE.FILE,
        resourceId: file.id,
      },
      ...ancestorIds.map((id) => ({
        resourceType: SHARE_RESOURCE_TYPE.FOLDER,
        resourceId: id,
      })),
    ]);

    return shares.length > 0;
  }

  async clipBreadcrumbStart(
    userId: string,
    folder: Folder,
  ): Promise<string | null> {
    const dataRoom = await this.shareRepository.findDataRoom(folder.dataRoomId);
    if (dataRoom?.ownerId === userId) {
      return null;
    }

    const ancestorIds = await this.shareRepository.findAncestorFolderIds(
      folder.id,
    );
    const shares = await this.findUserShares(userId, [
      {
        resourceType: SHARE_RESOURCE_TYPE.DATA_ROOM,
        resourceId: folder.dataRoomId,
      },
      ...ancestorIds.map((id) => ({
        resourceType: SHARE_RESOURCE_TYPE.FOLDER,
        resourceId: id,
      })),
    ]);

    if (shares.some((share) => share.resourceType === SHARE_RESOURCE_TYPE.DATA_ROOM)) {
      return null;
    }

    const folderShareIds = new Set(
      shares
        .filter((share) => share.resourceType === SHARE_RESOURCE_TYPE.FOLDER)
        .map((share) => share.resourceId),
    );

    return ancestorIds.find((id) => folderShareIds.has(id)) ?? folder.id;
  }

  async assertFolderWithinShare(share: Share, folderId: string) {
    if (share.resourceType === SHARE_RESOURCE_TYPE.FILE) {
      throw new ForbiddenException(SHARE_ERRORS.FORBIDDEN);
    }

    if (share.resourceType === SHARE_RESOURCE_TYPE.DATA_ROOM) {
      const folder = await this.shareRepository.findFolder(folderId);
      if (!folder || folder.dataRoomId !== share.dataRoomId) {
        throw new NotFoundException(FOLDER_ERRORS.NOT_FOUND);
      }
      return folder;
    }

    const inTree = await this.shareRepository.isFolderInSubtree(
      share.resourceId,
      folderId,
    );
    if (!inTree) {
      throw new ForbiddenException(SHARE_ERRORS.FORBIDDEN);
    }

    const folder = await this.shareRepository.findFolder(folderId);
    if (!folder) {
      throw new NotFoundException(FOLDER_ERRORS.NOT_FOUND);
    }
    return folder;
  }

  async assertFileWithinShare(share: Share, fileId: string) {
    const file = await this.shareRepository.findFile(fileId);
    if (!file) {
      throw new NotFoundException(FILE_ERRORS.NOT_FOUND);
    }

    if (share.resourceType === SHARE_RESOURCE_TYPE.FILE) {
      if (share.resourceId !== file.id) {
        throw new ForbiddenException(SHARE_ERRORS.FORBIDDEN);
      }
      return file;
    }

    if (share.resourceType === SHARE_RESOURCE_TYPE.DATA_ROOM) {
      if (file.dataRoomId !== share.dataRoomId) {
        throw new ForbiddenException(SHARE_ERRORS.FORBIDDEN);
      }
      return file;
    }

    const inTree = await this.shareRepository.isFolderInSubtree(
      share.resourceId,
      file.folderId,
    );
    if (!inTree) {
      throw new ForbiddenException(SHARE_ERRORS.FORBIDDEN);
    }

    return file;
  }

  shareRootFolderId(share: Share, rootFolderId: string | null) {
    if (share.resourceType === SHARE_RESOURCE_TYPE.DATA_ROOM) {
      return rootFolderId;
    }
    if (share.resourceType === SHARE_RESOURCE_TYPE.FOLDER) {
      return share.resourceId;
    }
    return null;
  }

  private async findUserShares(
    userId: string,
    resources: { resourceType: ShareResourceType; resourceId: string }[],
  ) {
    const user = await this.shareRepository.findUserById(userId);
    if (!user) {
      return [];
    }

    return this.shareRepository.findActiveMatching({
      userId,
      email: user.email,
      resources,
    });
  }

  private async loadResource(
    resourceType: ShareResourceType,
    resourceId: string,
  ): Promise<ResourceRef> {
    if (resourceType === SHARE_RESOURCE_TYPE.DATA_ROOM) {
      const dataRoom = await this.shareRepository.findDataRoom(resourceId);
      if (!dataRoom) {
        throw new NotFoundException(DATA_ROOM_ERRORS.NOT_FOUND);
      }
      return {
        resourceType,
        resourceId,
        dataRoomId: dataRoom.id,
      };
    }

    if (resourceType === SHARE_RESOURCE_TYPE.FOLDER) {
      const folder = await this.shareRepository.findFolder(resourceId);
      if (!folder) {
        throw new NotFoundException(FOLDER_ERRORS.NOT_FOUND);
      }
      return {
        resourceType,
        resourceId,
        dataRoomId: folder.dataRoomId,
      };
    }

    const file = await this.shareRepository.findFile(resourceId);
    if (!file) {
      throw new NotFoundException(FILE_ERRORS.NOT_FOUND);
    }

    return {
      resourceType,
      resourceId,
      dataRoomId: file.dataRoomId,
    };
  }

  private notFoundMessage(resourceType: ShareResourceType) {
    if (resourceType === SHARE_RESOURCE_TYPE.FILE) {
      return FILE_ERRORS.NOT_FOUND;
    }
    if (resourceType === SHARE_RESOURCE_TYPE.FOLDER) {
      return FOLDER_ERRORS.NOT_FOUND;
    }
    return DATA_ROOM_ERRORS.NOT_FOUND;
  }
}
