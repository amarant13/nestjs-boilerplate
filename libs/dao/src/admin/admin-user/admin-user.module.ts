import { Module } from '@nestjs/common';
import { TypeOrmExModule } from '@libs/common/database/typeorm/typeorm-ex.module';
import { AdminUserRepository } from '@libs/dao/admin/admin-user/admin-user.repository';
import { DATABASE_NAME } from '@libs/common/constants/database.constants';

@Module({
  imports: [
    TypeOrmExModule.forFeatures([AdminUserRepository], [DATABASE_NAME.ADMIN]),
  ],
  exports: [TypeOrmExModule],
})
export class AdminUserModule {}
