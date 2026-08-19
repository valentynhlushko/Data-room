import { PrismaClient } from '@prisma/client';

export type Share = Awaited<
  ReturnType<PrismaClient['share']['findFirstOrThrow']>
>;
