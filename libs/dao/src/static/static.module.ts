import { Module } from '@nestjs/common';
import { DataCharacterRepository } from '@libs/dao/static/data-character/data-character.repository';
import { DataCurrencyRepository } from '@libs/dao/static/data-currency/data-currency.repository';
import { DataEquipmentRepository } from '@libs/dao/static/data-equipment/data-equipment.repository';
import { DataItemRepository } from '@libs/dao/static/data-item/data-item.repository';

@Module({
  providers: [
    DataCharacterRepository,
    DataCurrencyRepository,
    DataEquipmentRepository,
    DataItemRepository,
  ],
  exports: [
    DataCharacterRepository,
    DataCurrencyRepository,
    DataEquipmentRepository,
    DataItemRepository,
  ],
})
export class StaticModule {}
