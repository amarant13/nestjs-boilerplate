import { CurrencyDto } from '@libs/dao/game/currency/dto/currency.dto';
import { flatten, Inject, Injectable } from '@nestjs/common';
import { DataCurrencyRepository } from '@libs/dao/static/data-currency/data-currency.repository';
import { GOODS_TYPE, GoodsType } from '@libs/common/constants/common.contants';
import { Reward } from '@libs/common/interface/goods.interface';
import { ServerErrorException } from '@libs/common/exception/server-error.exception';
import { INTERNAL_ERROR_CODE } from '@libs/common/constants/internal-error-code.constants';
import {
  CurrencyRepositories,
  CurrencyRepository,
} from '@libs/dao/game/currency/currency.repository';
import { ContextProvider } from '@libs/common/provider/context.provider';
import { CURRENCY_PROPS } from '@libs/common/constants/currency.constants';
import { Currency } from '@libs/dao/game/currency/currency.entity';
import { DataItemRepository } from '@libs/dao/static/data-item/data-item.repository';
import { ItemDto } from '@libs/dao/game/item/dto/item.dto';
import {
  ItemRepositories,
  ItemRepository,
} from '@libs/dao/game/item/item.repository';
import { Item } from '@libs/dao/game/item/item.entity';
import { CharacterDto } from '@libs/dao/game/character/dto/character.dto';
import {
  CharacterRepositories,
  CharacterRepository,
} from '@libs/dao/game/character/character.repository';
import { DataCharacterRepository } from '@libs/dao/static/data-character/data-character.repository';
import { Character } from '@libs/dao/game/character/character.entity';
import { Equipment } from '@libs/dao/game/equipment/equipment.entity';
import { EquipmentDto } from '@libs/dao/game/equipment/dto/equipment.dto';
import {
  EquipmentRepositories,
  EquipmentRepository,
} from '@libs/dao/game/equipment/equipment.repository';
import { DataEquipmentRepository } from '@libs/dao/static/data-equipment/data-equipment.repository';

/**
 * 위임 함수에서 사용될 return 타입 정의
 */
type DelegateFunctionReturn =
  | CurrencyDto
  | ItemDto
  | CharacterDto
  | EquipmentDto;

/**
 * 위임 함수의 타입 (parameter, return) 정의
 */
type DelegateFunction = (
  rewards: Reward[],
) => Promise<DelegateFunctionReturn[]>;

@Injectable()
export class RewardProvider {
  private readonly rewardDelegate: Record<number, DelegateFunction>;

  constructor(
    @Inject(CurrencyRepository)
    private readonly currencyRepositories: CurrencyRepositories,
    @Inject(CharacterRepository)
    private readonly characterRepositories: CharacterRepositories,
    @Inject(EquipmentRepository)
    private readonly equipmentRepositories: EquipmentRepositories,
    @Inject(ItemRepository)
    private readonly itemRepositories: ItemRepositories,
    private readonly dataCharacterRepository: DataCharacterRepository,
    private readonly dataCurrencyRepository: DataCurrencyRepository,
    private readonly dataItemRepository: DataItemRepository,
    private readonly dataEquipmentRepository: DataEquipmentRepository,
  ) {
    this.rewardDelegate = {
      [GOODS_TYPE.CURRENCY]: this._payCurrency.bind(this),
      [GOODS_TYPE.CHARACTER]: this._payCharacter.bind(this),
      [GOODS_TYPE.EQUIPMENT]: this._payEquipment.bind(this),
      [GOODS_TYPE.ITEM]: this._payItem.bind(this),
    };
  }

  /**
   * 즉시 지급
   */
  async pay(rewards: Reward[]): Promise<DelegateFunctionReturn[]> {
    // 캐릭터 & 장비 제외한 보상
    const otherRewards = this._margeRewards(rewards);

    // reward 를 키 = goodsType, 값 = reward[] 로 객체 생성
    const rewardMap = new Map<GoodsType, Reward[]>();

    for (const reward of otherRewards) {
      rewardMap.has(reward.goodsType)
        ? rewardMap.get(reward.goodsType).push(reward)
        : rewardMap.set(reward.goodsType, [reward]);
    }

    // rewardMap 비동기 처리하기 위해 promise,all 사용
    const resultRewards = await Promise.all(
      [...rewardMap].map(([goodsType, rewards]) =>
        this.rewardDelegate[goodsType](rewards),
      ),
    );

    // flatten === spread operator( ex) [...results] )
    return flatten(resultRewards);
  }

  /**
   * 통화 지급
   */
  private async _payCurrency(rewards: Reward[]): Promise<CurrencyDto> {
    // validate currency ids
    const dataCurrencyIds = rewards.map((it) => it.dataId);
    const dataCurrencies =
      this.dataCurrencyRepository.findByIdIn(dataCurrencyIds);

    // 통화 데이터 확인
    if (rewards.length !== dataCurrencies.length) {
      throw new ServerErrorException(INTERNAL_ERROR_CODE.DATA_INVALID);
    }

    const { userId, database } = ContextProvider.getSession();

    const currencyRepository = this.currencyRepositories[database];
    let currency = await currencyRepository.findByUserId(userId);

    // currency 가 null 일때 create (처음 만들어질때)
    if (!currency) {
      currency = Currency.create({ userId: userId, cash: 0, gold: 0 });
    }

    for (const reward of rewards) {
      const dataCurrency = this.dataCurrencyRepository.findById(reward.dataId);

      // currency 의 타입에 따라 userDetail 수량 + 하려고 타입 나눔 1이면 골드 2이면 캐쉬
      const currencyProp = CURRENCY_PROPS[dataCurrency.CURRENCY_TYPE];

      // 통화 타입이 있는지 확인
      if (!currencyProp) {
        throw new ServerErrorException(
          INTERNAL_ERROR_CODE.CURRENCY_UNKNOWN_TYPE,
        );
      }

      currency[currencyProp] += reward.quantity;
    }

    currency.id
      ? await currencyRepository.updateById(currency.id, currency)
      : await currencyRepository.insert(currency);

    return CurrencyDto.fromEntity(currency);
  }

  /**
   * 캐릭터 지급 (캐릭터 중복 가능)
   */
  private async _payCharacter(rewards: Reward[]): Promise<CharacterDto[]> {
    // validate character ids
    const dataCharacterIds = rewards.map((it) => it.dataId);
    const dataCharacters =
      this.dataCharacterRepository.findByIdIn(dataCharacterIds);

    // 캐릭터 데이터 확인
    if (rewards.length !== dataCharacters.length) {
      throw new ServerErrorException(INTERNAL_ERROR_CODE.DATA_INVALID);
    }

    const { userId, database } = ContextProvider.getSession();

    const characterRepository = this.characterRepositories[database];

    // character 지급 및 insert (update 할게 없고 insert 를 해야됨)
    const characters = rewards.flatMap((reward) => {
      // quantity 만큼 Character 를 생성하고 insertCharacters 배열에 추가
      return Array.from({ length: reward.quantity }, () =>
        Character.create({
          userId: userId,
          dataCharacterId: reward.dataId,
        }),
      );
    });

    // character 에 insert
    await characterRepository.insert(characters);

    return CharacterDto.fromEntities(characters);
  }

  /**
   * 장비 지급
   */
  private async _payEquipment(rewards: Reward[]): Promise<EquipmentDto[]> {
    const dataEquipmentIds = rewards.map((it) => it.dataId);
    const dataEquipments =
      this.dataEquipmentRepository.findByIdIn(dataEquipmentIds);

    if (rewards.length !== dataEquipments.length) {
      throw new ServerErrorException(INTERNAL_ERROR_CODE.DATA_INVALID);
    }

    const { userId, database } = ContextProvider.getSession();

    const equipmentRepository = this.equipmentRepositories[database];

    const equipments = rewards.flatMap((reward) => {
      // quantity 만큼 Character 를 생성하고 insertCharacters 배열에 추가
      return Array.from({ length: reward.quantity }, () =>
        Equipment.create({
          userId: userId,
          dataEquipmentId: reward.dataId,
        }),
      );
    });

    await equipmentRepository.insert(equipments);

    return EquipmentDto.fromEntities(equipments);
  }

  /**
   * 아이템 지급
   */
  private async _payItem(rewards: Reward[]): Promise<ItemDto[]> {
    // 보상 받은 아이템이 있는지 확인
    const dataItemIds = rewards.map((reward) => reward.dataId);
    const dataItems = this.dataItemRepository.findByIdIn(dataItemIds);

    if (rewards.length !== dataItems.length) {
      throw new ServerErrorException(INTERNAL_ERROR_CODE.DATA_INVALID);
    }

    const { userId, database } = ContextProvider.getSession();

    // 유저가 아이템 가지고 있는지 확인
    const itemRepository = this.itemRepositories[database];

    const items = await itemRepository.findByUserIdAndDataItemIdIn(
      userId,
      dataItemIds,
    );

    const updateItems = rewards.map((reward) => {
      // 이미 가지고 있으면 개수 증가, 앖으면 생성
      // find((it) => {...}) => {} 사용하면 undefined
      const item = items.find((it) => it.dataItemId === reward.dataId);

      if (!item) {
        return Item.create({
          userId: userId,
          dataItemId: reward.dataId,
          count: reward.quantity,
        });
      }

      item.count += reward.quantity;

      return item;
    });

    // upsert 로 update 안된거면 가만히 두고 update 된거면 update
    await itemRepository.upsert(updateItems, {
      conflictPaths: ['id'],
      skipUpdateIfNoValuesChanged: true,
    });

    const updatedItems = await itemRepository.findByUserIdAndDataItemIdIn(
      userId,
      dataItemIds,
    );

    return ItemDto.fromEntities(updatedItems);
  }

  /**
   * 보상 병합
   */
  private _margeRewards(rewards: Reward[]): Reward[] {
    const rewardsMap = new Map<string, Reward>();

    for (const reward of rewards) {
      if (reward.goodsType === GOODS_TYPE.NONE) {
        continue;
      }

      const key = `${reward.goodsType}_${reward.dataId}`;

      // goodsType 과 dataId 이 같은 데이터 합치기 (수량 +)
      rewardsMap.has(key)
        ? (rewardsMap.get(key).quantity += reward.quantity)
        : rewardsMap.set(key, {
            goodsType: reward.goodsType,
            dataId: reward.dataId,
            quantity: reward.quantity,
          });
    }

    return [...rewardsMap.values()];
  }
}
