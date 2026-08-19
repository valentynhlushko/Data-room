import { Transform } from 'class-transformer';
import { ArrayMinSize, IsArray, IsEmail } from 'class-validator';
import { ShareResourceDto } from './share-resource.dto';

export class InviteShareUsersDto extends ShareResourceDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsEmail({}, { each: true })
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value.map((email) =>
          typeof email === 'string' ? email.trim().toLowerCase() : email,
        )
      : value,
  )
  emails: string[];
}
