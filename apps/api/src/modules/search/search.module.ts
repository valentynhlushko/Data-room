import { Module } from '@nestjs/common';
import { DataRoomModule } from '../data-room/data-room.module';
import { FolderModule } from '../folder/folder.module';
import { ShareModule } from '../share/share.module';
import { SearchController } from './search.controller';
import { SearchRepository } from './repositories/search.repository';
import { SearchService } from './search.service';

@Module({
  imports: [ShareModule, FolderModule, DataRoomModule],
  controllers: [SearchController],
  providers: [SearchService, SearchRepository],
})
export class SearchModule {}
