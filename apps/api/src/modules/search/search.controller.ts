import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User } from '../user/types/user.types';
import { SearchQueryDto } from './dto/search.query.dto';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  search(@CurrentUser() user: User, @Query() query: SearchQueryDto) {
    return this.searchService.search(user.id, user.email, query.q);
  }
}
