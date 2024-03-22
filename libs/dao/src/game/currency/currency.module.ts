import { Module } from '@nestjs/common';
import { TypeOrmExModule } from '@libs/common/database/typeorm/typeorm-ex.module';
import { gameShardDatabases } from '@libs/common/database/typeorm/typeorm-module.options';
import { CurrencyRepository } from '@libs/dao/game/currency/currency.repository';

@Module({
  imports: [
    TypeOrmExModule.forFeatures([CurrencyRepository], gameShardDatabases),
  ],
  exports: [TypeOrmExModule],
})
export class CurrencyModule {}
