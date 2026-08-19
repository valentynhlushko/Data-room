import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User } from '../user/types/user.types';
import { FILE_MAX_BYTES } from './constants/file.errors';
import { UploadFileDto } from './dto/upload.file.dto';
import { UpdateFileDto } from './dto/update.file.dto';
import { FileService } from './file.service';
import { MulterExceptionFilter } from './filters/multer-exception.filter';

@Controller('files')
@UseFilters(MulterExceptionFilter)
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: FILE_MAX_BYTES },
    }),
  )
  upload(
    @CurrentUser() user: User,
    @Body() dto: UploadFileDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.fileService.upload(user.id, dto.folderId, {
      originalname: file?.originalname ?? 'document.pdf',
      mimetype: file?.mimetype ?? '',
      size: file?.size ?? 0,
      buffer: file?.buffer ?? Buffer.alloc(0),
    });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getById(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.fileService.getById(id, user.id);
  }

  @Get(':id/preview-url')
  @UseGuards(JwtAuthGuard)
  getPreviewUrl(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.fileService.getPreviewUrl(id, user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFileDto,
  ) {
    return this.fileService.update(id, user.id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  delete(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.fileService.delete(id, user.id);
  }
}
