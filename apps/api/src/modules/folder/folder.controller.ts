import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User } from '../user/types/user.types';
import { ListFilesQueryDto } from '../file/dto/list-files.query.dto';
import { CreateFolderDto } from './dto/create.folder.dto';
import { UpdateFolderDto } from './dto/update.folder.dto';
import { FolderService } from './folder.service';

@Controller('folders')
export class FolderController {
  constructor(private readonly folderService: FolderService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: User, @Body() dto: CreateFolderDto) {
    return this.folderService.create(user.id, dto.parentId, dto.name);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getById(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.folderService.getById(id, user);
  }

  @Get(':id/contents')
  @UseGuards(JwtAuthGuard)
  getContents(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: ListFilesQueryDto,
  ) {
    return this.folderService.getContents(id, user, query);
  }

  @Get(':id/deletion-preview')
  @UseGuards(JwtAuthGuard)
  getDeletionPreview(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.folderService.getDeletionPreview(id, user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  rename(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFolderDto,
  ) {
    return this.folderService.rename(id, user.id, dto.name);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  delete(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.folderService.delete(id, user.id);
  }
}
