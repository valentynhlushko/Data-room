import { PrismaClient } from '@prisma/client';

export type FileRecord = Awaited<
  ReturnType<PrismaClient['file']['findFirstOrThrow']>
>;
