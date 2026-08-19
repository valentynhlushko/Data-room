import { Global, Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { SupabaseAuthService } from './supabase-auth.service';

@Global()
@Module({
  imports: [UserModule],
  providers: [JwtAuthGuard, SupabaseAuthService],
  exports: [JwtAuthGuard, SupabaseAuthService, UserModule],
})
export class AuthModule {}
