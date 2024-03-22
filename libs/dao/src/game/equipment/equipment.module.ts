import { Module } from '@nestjs/common';
import { TypeOrmExModule } from '@libs/common/database/typeorm/typeorm-ex.module';
import { EquipmentRepository } from '@libs/dao/game/equipment/equipment.repository';
import { gameShardDatabases } from '@libs/common/database/typeorm/typeorm-module.options';

@Module({
  imports: [
    TypeOrmExModule.forFeatures([EquipmentRepository], gameShardDatabases),
  ],
  exports: [TypeOrmExModule],
})
export class EquipmentModule {}
