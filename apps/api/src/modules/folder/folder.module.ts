import { Module } from '@nestjs/common';
import { FileModule } from '../file/file.module';
import { ShareModule } from '../share/share.module';
import { FolderController } from './folder.controller';
import { FolderRepository } from './repositories/folder.repository';
import { FolderService } from './folder.service';

@Module({
  imports: [FileModule, ShareModule],
  controllers: [FolderController],
  providers: [FolderService, FolderRepository],
  exports: [FolderService, FolderRepository],
})
export class FolderModule {}
