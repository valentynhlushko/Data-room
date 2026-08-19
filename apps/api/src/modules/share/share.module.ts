import { Module } from '@nestjs/common';
import { AccessService } from './access.service';
import { ShareController } from './share.controller';
import { ShareLinkController } from './share-link.controller';
import { ShareLinkService } from './share-link.service';
import { ShareRepository } from './repositories/share.repository';
import { ShareService } from './share.service';

@Module({
  controllers: [ShareController, ShareLinkController],
  providers: [ShareRepository, ShareService, ShareLinkService, AccessService],
  exports: [ShareService, AccessService, ShareRepository],
})
export class ShareModule {}
