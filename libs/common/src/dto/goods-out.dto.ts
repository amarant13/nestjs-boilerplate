import { BaseOutDto } from '@libs/common/dto/base-out.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyDto } from '@libs/dao/game/currency/dto/currency.dto';
import { ItemDto } from '@libs/dao/game/item/dto/item.dto';
import { CharacterDto } from '@libs/dao/game/character/dto/character.dto';
import { EquipmentDto } from '@libs/dao/game/equipment/dto/equipment.dto';

export class GoodsOutDto extends BaseOutDto {
  @ApiPropertyOptional({ type: CurrencyDto })
  currency?: CurrencyDto;

  @ApiPropertyOptional({ type: CharacterDto, isArray: true })
  characters?: CharacterDto[];

  @ApiPropertyOptional({ type: EquipmentDto, isArray: true })
  equipments?: EquipmentDto[];

  @ApiPropertyOptional({ type: ItemDto, isArray: true })
  items?: ItemDto[];

  @ApiPropertyOptional({ type: Number, isArray: true })
  consumedCharacterIds?: number[];

  @ApiPropertyOptional({ type: Number, isArray: true })
  consumedEquipmentIds?: number[];
}
