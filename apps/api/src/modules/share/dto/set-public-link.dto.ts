import { IsBoolean } from 'class-validator';
import { ShareResourceDto } from './share-resource.dto';

export class SetPublicLinkDto extends ShareResourceDto {
  @IsBoolean()
  enabled: boolean;
}
