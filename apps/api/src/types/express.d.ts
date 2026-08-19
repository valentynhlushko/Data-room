import type { User } from '../modules/user/types/user.types';
import type { SupabaseJwtPayload } from '../modules/auth/types/supabase-jwt';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      authPayload?: SupabaseJwtPayload;
    }
  }
}

export {};
