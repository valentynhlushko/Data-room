import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User } from '../user/types/user.types';
import { InviteShareUsersDto } from './dto/invite-share-users.dto';
import { ListSharesQueryDto } from './dto/list-shares.query.dto';
import { SetPublicLinkDto } from './dto/set-public-link.dto';
import { ShareService } from './share.service';

@Controller('shares')
export class ShareController {
  constructor(private readonly shareService: ShareService) {}

  @Get('inbox')
  @UseGuards(JwtAuthGuard)
  inbox(@CurrentUser() user: User) {
    return this.shareService.inbox(user.id, user.email);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  list(@CurrentUser() user: User, @Query() query: ListSharesQueryDto) {
    return this.shareService.listForResource(
      user.id,
      query.resourceType,
      query.resourceId,
    );
  }

  @Post('users')
  @UseGuards(JwtAuthGuard)
  invite(@CurrentUser() user: User, @Body() dto: InviteShareUsersDto) {
    return this.shareService.inviteUsers(user.id, {
      resourceType: dto.resourceType,
      resourceId: dto.resourceId,
      emails: dto.emails,
    });
  }

  @Put('public-link')
  @UseGuards(JwtAuthGuard)
  setPublicLink(@CurrentUser() user: User, @Body() dto: SetPublicLinkDto) {
    return this.shareService.setPublicLink(user.id, {
      resourceType: dto.resourceType,
      resourceId: dto.resourceId,
      enabled: dto.enabled,
    });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  revoke(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.shareService.revoke(user.id, id);
  }
}
