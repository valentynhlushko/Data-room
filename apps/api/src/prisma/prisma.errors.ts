import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

export function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof PrismaClientKnownRequestError && error.code === 'P2002';
}
