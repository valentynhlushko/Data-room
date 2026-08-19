import { IsEnum, IsUUID } from 'class-validator';
import {
  SHARE_RESOURCE_TYPE,
  type ShareResourceType,
} from '../constants/share.errors';

export class ShareResourceDto {
  @IsEnum(SHARE_RESOURCE_TYPE)
  resourceType: ShareResourceType;

  @IsUUID()
  resourceId: string;
}
