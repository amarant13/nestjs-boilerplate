import { Injectable } from '@nestjs/common';
import { ConsumptionProvider } from '@libs/common/provider/goods/consumption.provider';
import { RewardProvider } from '@libs/common/provider/goods/reward.provider';
import { Material, Reward } from '@libs/common/interface/goods.interface';
import { GoodsOutDto } from '@libs/common/dto/goods-out.dto';
import { CurrencyDto } from '@libs/dao/game/currency/dto/currency.dto';
import { ItemDto } from '@libs/dao/game/item/dto/item.dto';
import { ServerErrorException } from '@libs/common/exception/server-error.exception';
import { INTERNAL_ERROR_CODE } from '@libs/common/constants/internal-error-code.constants';
import { CharacterDto } from '@libs/dao/game/character/dto/character.dto';
import { EquipmentDto } from '@libs/dao/game/equipment/dto/equipment.dto';

@Injectable()
export class GoodsProvider {
  constructor(
    private readonly consumptionProvider: ConsumptionProvider,
    private readonly rewardProvider: RewardProvider,
  ) {}

  /**
   * 지급
   */
  async pay(rewards: Reward[]): Promise<GoodsOutDto> {
    if (!rewards || rewards.isEmpty()) {
      return {};
    }

    // quantity 음수 예외처리
    for (const reward of rewards) {
      const { quantity } = reward;

      if (0 > quantity) {
        throw new ServerErrorException(INTERNAL_ERROR_CODE.DATA_INVALID);
      }
    }

    const results = await this.rewardProvider.pay(rewards);

    return GoodsOutDto.of({
      currency: results.filter(
        (it) => it instanceof CurrencyDto,
      )[0] as CurrencyDto,
      items: results.filter((it) => it instanceof ItemDto) as ItemDto[],
      characters: results.filter(
        (it) => it instanceof CharacterDto,
      ) as CharacterDto[],
      equipments: results.filter(
        (it) => it instanceof EquipmentDto,
      ) as EquipmentDto[],
    });
  }

  /**
   * 소비
   */
  async consume(materials: Material[]): Promise<GoodsOutDto> {
    if (!materials || materials.isEmpty()) {
      return {};
    }

    // quantity 음수 예외 처리
    for (const material of materials) {
      const { quantity } = material;

      if (0 >= quantity) {
        throw new ServerErrorException(INTERNAL_ERROR_CODE.DATA_INVALID);
      }
    }

    const results = await this.consumptionProvider.consume(materials);

    return GoodsOutDto.of({
      currency: results.filter(
        (it) => it instanceof CurrencyDto,
      )[0] as CurrencyDto,
      items: results.filter((it) => it instanceof ItemDto) as ItemDto[],
      consumedCharacterIds: results
        .filter((it) => it instanceof CharacterDto)
        .map((it: CharacterDto) => it.id),
      consumedEquipmentIds: results
        .filter((it) => it instanceof EquipmentDto)
        .map((it: EquipmentDto) => it.id),
    });
  }
}
