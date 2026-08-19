import { Injectable, NotFoundException } from '@nestjs/common';
import { DATA_ROOM_ERRORS } from './constants/data-room.errors';
import { DataRoomRepository } from './repositories/data-room.repository';
import type { DataRoom } from './types/data-room.types';
import { FolderRepository } from '../folder/repositories/folder.repository';
import type { Folder } from '../folder/types/folder.types';

@Injectable()
export class DataRoomService {
  constructor(
    private readonly dataRoomRepository: DataRoomRepository,
    private readonly folderRepository: FolderRepository,
  ) {}

  async ensureCurrent(ownerId: string): Promise<{
    dataRoom: DataRoom;
    rootFolder: Folder;
  }> {
    let dataRoom = await this.dataRoomRepository.findFirstByOwnerId(ownerId);

    if (!dataRoom) {
      dataRoom = await this.dataRoomRepository.createWithRootFolder(ownerId);
    }

    const rootFolder = await this.folderRepository.findRootByDataRoomId(
      dataRoom.id,
    );

    if (!rootFolder) {
      throw new NotFoundException(DATA_ROOM_ERRORS.ROOT_FOLDER_MISSING);
    }

    return { dataRoom, rootFolder };
  }
}
