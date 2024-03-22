import { AdminServerConfig } from './config/admin-server.config';
import { Module } from '@nestjs/common';
import { AdminController } from './default/admin.controller';
import { TypeOrmExModule } from '@libs/common/database/typeorm/typeorm-ex.module';
import {
  adminTypeOrmModuleOptions,
  commonTypeOrmModuleOptions,
} from '@libs/common/database/typeorm/typeorm-module.options';
import { AdminService } from './default/admin.service';
import { AdminJsModule } from './admin-js/admin-js.module';
import { UserModule } from '@libs/dao/common/user/user.module';
import { UserController } from './user/user.controller';
import { UserService } from './user/user.service';
import { AdminUserModule } from '@libs/dao/admin/admin-user/admin-user.module';
import { AdminUserController } from './admin-user/admin-user.controller';
import { AdminUserService } from './admin-user/admin-user.service';
import { AuthService } from './auth/auth.service';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    AdminServerConfig,
    TypeOrmExModule.forRoot(adminTypeOrmModuleOptions),
    TypeOrmExModule.forRoot(commonTypeOrmModuleOptions),

    AdminJsModule.createAdminAsync(),

    // dao
    AuthModule,
    AdminUserModule,
    UserModule,
  ],
  controllers: [AdminController, AdminUserController, UserController],
  providers: [AdminService, UserService, AdminUserService, AuthService],
})
export class AdminModule {}
