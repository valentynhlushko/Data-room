import { PrismaClient } from '@prisma/client';

export type User = Awaited<ReturnType<PrismaClient['user']['findFirstOrThrow']>>;
