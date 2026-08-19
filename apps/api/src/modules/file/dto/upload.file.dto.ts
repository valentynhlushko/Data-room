import { IsUUID } from 'class-validator';

export class UploadFileDto {
  @IsUUID()
  folderId: string;
}
