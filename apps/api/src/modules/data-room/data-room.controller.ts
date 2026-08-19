import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User } from '../user/types/user.types';
import { DataRoomService } from './data-room.service';

@Controller('data-rooms')
export class DataRoomController {
  constructor(private readonly dataRoomService: DataRoomService) {}

  @Get('current')
  @UseGuards(JwtAuthGuard)
  getCurrent(@CurrentUser() user: User) {
    return this.dataRoomService.ensureCurrent(user.id);
  }
}
