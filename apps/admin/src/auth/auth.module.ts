import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AdminUserModule } from '@libs/dao/admin/admin-user/admin-user.module';
import { ApiKeyStrategy } from './strategy/api-key.strategy';
import { AuthService } from './auth.service';

@Module({
  imports: [PassportModule, AdminUserModule],
  providers: [ApiKeyStrategy, AuthService],
  exports: [AuthService],
})
export class AuthModule {}
