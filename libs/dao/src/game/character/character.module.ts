import { Module } from '@nestjs/common';
import { TypeOrmExModule } from '@libs/common/database/typeorm/typeorm-ex.module';
import { CharacterRepository } from '@libs/dao/game/character/character.repository';
import { gameShardDatabases } from '@libs/common/database/typeorm/typeorm-module.options';

@Module({
  imports: [
    TypeOrmExModule.forFeatures([CharacterRepository], gameShardDatabases),
  ],
  exports: [TypeOrmExModule],
})
export class CharacterModule {}
