import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ListFilesQueryDto } from '../file/dto/list-files.query.dto';
import { ShareLinkService } from './share-link.service';

@Controller('share-links')
export class ShareLinkController {
  constructor(private readonly shareLinkService: ShareLinkService) {}

  @Get(':token')
  resolve(@Param('token') token: string) {
    return this.shareLinkService.resolve(token);
  }

  @Get(':token/folders/:folderId/contents')
  getFolderContents(
    @Param('token') token: string,
    @Param('folderId', ParseUUIDPipe) folderId: string,
    @Query() query: ListFilesQueryDto,
  ) {
    return this.shareLinkService.getFolderContents(token, folderId, query);
  }

  @Get(':token/files/:fileId/preview-url')
  getFilePreviewUrl(
    @Param('token') token: string,
    @Param('fileId', ParseUUIDPipe) fileId: string,
  ) {
    return this.shareLinkService.getFilePreviewUrl(token, fileId);
  }
}
