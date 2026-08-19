import { join } from 'node:path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { FolderModule } from './modules/folder/folder.module';
import { DataRoomModule } from './modules/data-room/data-room.module';
import { StorageModule } from './modules/storage/storage.module';
import { FileModule } from './modules/file/file.module';
import { ShareModule } from './modules/share/share.module';
import { SearchModule } from './modules/search/search.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(process.cwd(), 'apps/api/.env'),
        join(process.cwd(), '.env'),
        '.env',
      ],
    }),
    PrismaModule,
    StorageModule,
    UserModule,
    AuthModule,
    FileModule,
    FolderModule,
    DataRoomModule,
    ShareModule,
    SearchModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

