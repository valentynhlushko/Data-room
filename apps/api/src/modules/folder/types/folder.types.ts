import { PrismaClient } from '@prisma/client';

export type Folder = Awaited<
  ReturnType<PrismaClient['folder']['findFirstOrThrow']>
>;

export type FolderSummary = Pick<
  Folder,
  'id' | 'name' | 'isRoot' | 'parentId' | 'dataRoomId' | 'createdAt' | 'updatedAt'
>;
