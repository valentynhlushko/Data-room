import { Module } from '@nestjs/common';
import { ShareModule } from '../share/share.module';
import { UserController } from './user.controller';
import { UserRepository } from './repositories/user.repository';
import { UserService } from './user.service';

@Module({
  imports: [ShareModule],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService],
})
export class UserModule {}
