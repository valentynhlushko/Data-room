import { PrismaClient } from '@prisma/client';

export type DataRoom = Awaited<
  ReturnType<PrismaClient['dataRoom']['findFirstOrThrow']>
>;
