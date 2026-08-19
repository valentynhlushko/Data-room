import { Module } from '@nestjs/common';
import { FolderModule } from '../folder/folder.module';
import { DataRoomController } from './data-room.controller';
import { DataRoomRepository } from './repositories/data-room.repository';
import { DataRoomService } from './data-room.service';

@Module({
  imports: [FolderModule],
  controllers: [DataRoomController],
  providers: [DataRoomService, DataRoomRepository],
  exports: [DataRoomService, DataRoomRepository],
})
export class DataRoomModule {}
