import { Module } from '@nestjs/common';
import { ShareModule } from '../share/share.module';
import { FileController } from './file.controller';
import { FileRepository } from './repositories/file.repository';
import { FileService } from './file.service';

@Module({
  imports: [ShareModule],
  controllers: [FileController],
  providers: [FileService, FileRepository],
  exports: [FileService, FileRepository],
})
export class FileModule {}
