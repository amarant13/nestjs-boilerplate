import { Module } from '@nestjs/common';
import { TypeOrmExModule } from '@libs/common/database/typeorm/typeorm-ex.module';
import { gameShardDatabases } from '@libs/common/database/typeorm/typeorm-module.options';
import { ItemRepository } from '@libs/dao/game/item/item.repository';

@Module({
  imports: [TypeOrmExModule.forFeatures([ItemRepository], gameShardDatabases)],
  exports: [TypeOrmExModule],
})
export class ItemModule {}
