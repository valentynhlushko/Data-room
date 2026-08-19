import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import {
  FILE_LIST_DEFAULT_LIMIT,
  FILE_LIST_MAX_LIMIT,
} from '../constants/file.errors';

export class ListFilesQueryDto {
  @IsOptional()
  @IsUUID()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(FILE_LIST_MAX_LIMIT)
  limit?: number = FILE_LIST_DEFAULT_LIMIT;
}
