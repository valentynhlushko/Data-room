import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUniqueConstraintError } from '../../prisma/prisma.errors';
import { FOLDER_ERRORS } from './constants/folder.errors';
import { DATA_ROOM_ERRORS } from '../data-room/constants/data-room.errors';
import { FolderRepository } from './repositories/folder.repository';
import type { Folder } from './types/folder.types';
import { FileService } from '../file/file.service';
import { AccessService } from '../share/access.service';
import { ShareService } from '../share/share.service';

@Injectable()
export class FolderService {
  constructor(
    private readonly folderRepository: FolderRepository,
    private readonly fileService: FileService,
    private readonly accessService: AccessService,
    private readonly shareService: ShareService,
  ) {}

  async getById(id: string, userId: string) {
    const folder = await this.getReadableFolder(id, userId);
    const clipFrom = await this.accessService.clipBreadcrumbStart(
      userId,
      folder,
    );
    const breadcrumbs = await this.buildBreadcrumbs(folder, clipFrom);

    return { folder, breadcrumbs };
  }

  async getContents(
    id: string,
    userId: string,
    query: { cursor?: string; limit?: number } = {},
  ) {
    const folder = await this.getReadableFolder(id, userId);
    const clipFrom = await this.accessService.clipBreadcrumbStart(
      userId,
      folder,
    );
    const [breadcrumbs, folders, filePage, dataRoom] = await Promise.all([
      this.buildBreadcrumbs(folder, clipFrom),
      this.folderRepository.findChildren(id),
      this.fileService.listByFolder(id, query),
      this.folderRepository.findDataRoomMeta(folder.dataRoomId),
    ]);

    if (!dataRoom) {
      throw new NotFoundException(DATA_ROOM_ERRORS.NOT_FOUND);
    }

    return {
      folder,
      breadcrumbs,
      folders,
      files: filePage.files,
      nextFileCursor: filePage.nextCursor,
      dataRoom,
    };
  }

  async getDeletionPreview(id: string, userId: string) {
    const folder = await this.getOwnedFolder(id, userId);

    if (folder.isRoot) {
      throw new ForbiddenException(FOLDER_ERRORS.CANNOT_DELETE_ROOT);
    }

    const [nestedFolderCount, nestedFileCount] = await Promise.all([
      this.folderRepository.countDescendants(id),
      this.fileService.countInSubtree(id),
    ]);

    return {
      folder: {
        id: folder.id,
        name: folder.name,
      },
      nestedFolderCount,
      nestedFileCount,
    };
  }

  async create(userId: string, parentId: string, name: string) {
    const parent = await this.getOwnedFolder(parentId, userId);
    await this.assertUniqueName(parent.id, name);

    try {
      return await this.folderRepository.create({
        name,
        parentId: parent.id,
        dataRoomId: parent.dataRoomId,
        createdById: userId,
      });
    } catch (error) {
      this.throwIfNameConflict(error);
      throw error;
    }
  }

  async rename(id: string, userId: string, name: string) {
    const folder = await this.getOwnedFolder(id, userId);

    if (folder.isRoot) {
      throw new ForbiddenException(FOLDER_ERRORS.CANNOT_RENAME_ROOT);
    }

    if (folder.parentId) {
      await this.assertUniqueName(folder.parentId, name, folder.id);
    }

    try {
      return await this.folderRepository.updateName(id, name);
    } catch (error) {
      this.throwIfNameConflict(error);
      throw error;
    }
  }

  async delete(id: string, userId: string) {
    const folder = await this.getOwnedFolder(id, userId);

    if (folder.isRoot) {
      throw new ForbiddenException(FOLDER_ERRORS.CANNOT_DELETE_ROOT);
    }

    await this.shareService.deleteSharesForFolder(id);
    await this.fileService.deleteStorageForFolder(id);
    await this.folderRepository.deleteById(id);

    return { id };
  }

  private async getReadableFolder(id: string, userId: string): Promise<Folder> {
    const folder = await this.folderRepository.findById(id);

    if (!folder) {
      throw new NotFoundException(FOLDER_ERRORS.NOT_FOUND);
    }

    await this.accessService.assertCanViewFolder(userId, folder);
    return folder;
  }

  private async getOwnedFolder(id: string, userId: string): Promise<Folder> {
    const folder = await this.folderRepository.findById(id);

    if (!folder) {
      throw new NotFoundException(FOLDER_ERRORS.NOT_FOUND);
    }

    const ownerId = await this.folderRepository.findDataRoomOwnerId(
      folder.dataRoomId,
    );

    if (ownerId !== userId) {
      throw new ForbiddenException(FOLDER_ERRORS.FORBIDDEN);
    }

    return folder;
  }

  private async buildBreadcrumbs(folder: Folder, clipFromId?: string | null) {
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
        ? await this.folderRepository.findById(current.parentId)
        : null;
    }

    return breadcrumbs;
  }

  private async assertUniqueName(
    parentId: string,
    name: string,
    excludeId?: string,
  ) {
    const existing = await this.folderRepository.findSiblingByName(
      parentId,
      name,
      excludeId,
    );

    if (existing) {
      throw new ConflictException(FOLDER_ERRORS.NAME_CONFLICT);
    }
  }

  private throwIfNameConflict(error: unknown): void {
    if (isUniqueConstraintError(error)) {
      throw new ConflictException(FOLDER_ERRORS.NAME_CONFLICT);
    }
  }
}
