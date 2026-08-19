import { Injectable } from '@nestjs/common';
import { SHARE_RESOURCE_TYPE } from '../share/constants/share.errors';
import { AccessService } from '../share/access.service';
import { ShareRepository } from '../share/repositories/share.repository';
import { DataRoomRepository } from '../data-room/repositories/data-room.repository';
import { FolderRepository } from '../folder/repositories/folder.repository';
import { SearchRepository } from './repositories/search.repository';
import type { Folder } from '../folder/types/folder.types';

@Injectable()
export class SearchService {
  constructor(
    private readonly searchRepository: SearchRepository,
    private readonly shareRepository: ShareRepository,
    private readonly dataRoomRepository: DataRoomRepository,
    private readonly folderRepository: FolderRepository,
    private readonly accessService: AccessService,
  ) {}

  async search(userId: string, email: string, query: string) {
    const q = query.trim();
    if (!q) {
      return { folders: [], files: [] };
    }

    const scope = await this.buildScope(userId, email);
    const [folders, files] = await Promise.all([
      this.searchRepository.searchFolders({
        query: q,
        dataRoomIds: scope.dataRoomIds,
        folderIds: scope.folderIds,
      }),
      this.searchRepository.searchFiles({
        query: q,
        dataRoomIds: scope.dataRoomIds,
        folderIds: scope.folderIds,
        fileIds: scope.fileIds,
      }),
    ]);

    return {
      folders: await Promise.all(
        folders.map((folder) => this.toFolderHit(userId, folder)),
      ),
      files: await Promise.all(
        files.map((file) => this.toFileHit(userId, file)),
      ),
    };
  }

  private async buildScope(userId: string, email: string) {
    const dataRoomIds = new Set<string>();
    const folderIds = new Set<string>();
    const fileIds = new Set<string>();

    const owned = await this.dataRoomRepository.findFirstByOwnerId(userId);
    if (owned) {
      dataRoomIds.add(owned.id);
    }

    const shares = await this.shareRepository.findInbox(userId, email);

    for (const share of shares) {
      if (share.resourceType === SHARE_RESOURCE_TYPE.DATA_ROOM) {
        dataRoomIds.add(share.resourceId);
        continue;
      }

      if (share.resourceType === SHARE_RESOURCE_TYPE.FOLDER) {
        const subtree =
          await this.shareRepository.findSubtreeFolderAndFileIds(
            share.resourceId,
          );
        for (const id of subtree.folderIds) {
          folderIds.add(id);
        }
        continue;
      }

      fileIds.add(share.resourceId);
    }

    return {
      dataRoomIds: [...dataRoomIds],
      folderIds: [...folderIds],
      fileIds: [...fileIds],
    };
  }

  private async toFolderHit(
    userId: string,
    folder: {
      id: string;
      name: string;
      isRoot: boolean;
      parentId: string | null;
      dataRoomId: string;
    },
  ) {
    const full = await this.folderRepository.findById(folder.id);
    const dataRoom = await this.folderRepository.findDataRoomMeta(
      folder.dataRoomId,
    );
    const path = full
      ? await this.buildPath(userId, full)
      : [{ id: folder.id, name: folder.name, isRoot: folder.isRoot }];

    return {
      id: folder.id,
      name: folder.name,
      dataRoomName: dataRoom?.name ?? 'Files',
      path,
    };
  }

  private async toFileHit(
    userId: string,
    file: {
      id: string;
      name: string;
      folderId: string;
      dataRoomId: string;
    },
  ) {
    const parent = await this.folderRepository.findById(file.folderId);
    const dataRoom = await this.folderRepository.findDataRoomMeta(
      file.dataRoomId,
    );
    const path = parent ? await this.buildPath(userId, parent) : [];

    return {
      id: file.id,
      name: file.name,
      folderId: file.folderId,
      dataRoomName: dataRoom?.name ?? 'Files',
      path,
    };
  }

  private async buildPath(userId: string, folder: Folder) {
    const clipFrom = await this.accessService.clipBreadcrumbStart(
      userId,
      folder,
    );
    const path: { id: string; name: string; isRoot: boolean }[] = [];
    let current: Folder | null = folder;

    while (current) {
      path.unshift({
        id: current.id,
        name: current.name,
        isRoot: current.isRoot,
      });

      if (clipFrom && current.id === clipFrom) {
        break;
      }

      current = current.parentId
        ? await this.folderRepository.findById(current.parentId)
        : null;
    }

    return path;
  }
}
