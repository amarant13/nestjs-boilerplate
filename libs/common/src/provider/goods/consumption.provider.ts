import { flatten, Inject, Injectable } from '@nestjs/common';
import { Material } from '@libs/common/interface/goods.interface';
import { CurrencyDto } from '@libs/dao/game/currency/dto/currency.dto';
import { DataCurrencyRepository } from '@libs/dao/static/data-currency/data-currency.repository';
import { GOODS_TYPE, GoodsType } from '@libs/common/constants/common.contants';
import { ServerErrorException } from '@libs/common/exception/server-error.exception';
import { INTERNAL_ERROR_CODE } from '@libs/common/constants/internal-error-code.constants';
import { CURRENCY_PROPS } from '@libs/common/constants/currency.constants';
import {
  CurrencyRepositories,
  CurrencyRepository,
} from '@libs/dao/game/currency/currency.repository';
import { ContextProvider } from '@libs/common/provider/context.provider';
import { Currency } from '@libs/dao/game/currency/currency.entity';
import { ItemDto } from '@libs/dao/game/item/dto/item.dto';
import { Item } from '@libs/dao/game/item/item.entity';
import {
  ItemRepositories,
  ItemRepository,
} from '@libs/dao/game/item/item.repository';
import {
  EquipmentRepositories,
  EquipmentRepository,
} from '@libs/dao/game/equipment/equipment.repository';
import {
  CharacterRepositories,
  CharacterRepository,
} from '@libs/dao/game/character/character.repository';
import { CharacterDto } from '@libs/dao/game/character/dto/character.dto';
import { EquipmentDto } from '@libs/dao/game/equipment/dto/equipment.dto';

/**
 * 위임 함수에서 사용될 return 타입 정의
 */
type DelegateFunctionReturn =
  | CurrencyDto
  | CharacterDto
  | EquipmentDto
  | ItemDto;

/**
 * 위임 함수의 타입 (parameter, return) 정의
 */
type DelegateFunction = (
  materials: Material[],
) => Promise<DelegateFunctionReturn[]>;

@Injectable()
export class ConsumptionProvider {
  // recode 의 number 는 type number
  private readonly consumeDelegate: Record<number, DelegateFunction>;

  constructor(
    @Inject(CurrencyRepository)
    private readonly currencyRepositories: CurrencyRepositories,
    @Inject(CharacterRepository)
    private readonly characterRepositories: CharacterRepositories,
    @Inject(EquipmentRepository)
    private readonly equipmentRepositories: EquipmentRepositories,
    @Inject(ItemRepository)
    private readonly itemRepositories: ItemRepositories,
    private readonly dataCurrencyRepository: DataCurrencyRepository,
  ) {
    this.consumeDelegate = {
      [GOODS_TYPE.CURRENCY]: this._consumeCurrency.bind(this),
      [GOODS_TYPE.CHARACTER]: this._consumeCharacter.bind(this),
      [GOODS_TYPE.EQUIPMENT]: this._consumeEquipment.bind(this),
      [GOODS_TYPE.ITEM]: this._consumeItem.bind(this),
    };
  }

  /**
   * 소모
   */
  async consume(materials: Material[]): Promise<DelegateFunctionReturn[]> {
    const materialMap = new Map<GoodsType, Material[]>();

    for (const material of this._mergeMaterials(materials)) {
      const goodsType = material.goodsType;
      materialMap.has(goodsType)
        ? materialMap.get(goodsType).push(material)
        : materialMap.set(goodsType, [material]);
    }

    const results = await Promise.all(
      [...materialMap].map(([goodsType, materials]) =>
        this.consumeDelegate[goodsType](materials),
      ),
    );

    return flatten(results);
  }

  /**
   * 통화 소모
   */
  private async _consumeCurrency(materials: Material[]): Promise<CurrencyDto> {
    const currency = await this._getCurrency();

    for (const material of materials) {
      const dataCurrency = this.dataCurrencyRepository.findById(
        material.dataId,
      );

      // data 있는지 확인
      if (!dataCurrency) {
        throw new ServerErrorException(INTERNAL_ERROR_CODE.DATA_INVALID);
      }

      const currencyProp = CURRENCY_PROPS[dataCurrency.CURRENCY_TYPE];

      // 통화 타입이 있는지 확인
      if (!currencyProp) {
        throw new ServerErrorException(
          INTERNAL_ERROR_CODE.CURRENCY_UNKNOWN_TYPE,
        );
      }

      // 유저 상세정보에서 소모되는 값보다 많은지 확인
      if (currency[currencyProp] < material.quantity) {
        const errorCode = `CURRENCY_${currencyProp.toUpperCase()}_NOT_ENOUGH`;

        throw new ServerErrorException(INTERNAL_ERROR_CODE[errorCode]);
      }

      currency[currencyProp] -= material.quantity;
    }

    const { database } = ContextProvider.getSession();

    await this.currencyRepositories[database].updateById(currency.id, currency);

    return CurrencyDto.fromEntity(currency);
  }

  /**
   * 캐릭터 소모
   */
  private async _consumeCharacter(
    materials: Material[],
  ): Promise<CharacterDto[]> {
    const characterIds = materials.map((it) => it.id);

    const { userId, database } = ContextProvider.getSession();

    const characterRepository = this.characterRepositories[database];
    const characters = await characterRepository.findByIdInAndUserId(
      characterIds,
      userId,
    );

    if (characters.length !== characterIds.length) {
      throw new ServerErrorException(INTERNAL_ERROR_CODE.CHARACTER_NOT_FOUND);
    }

    await characterRepository.deleteByIdIn(characterIds);

    return CharacterDto.fromEntities(characters);
  }

  /**
   * 장비 소모
   */
  private async _consumeEquipment(
    materials: Material[],
  ): Promise<EquipmentDto[]> {
    const equipmentIds = materials.map((it) => it?.id);

    const { userId, database } = ContextProvider.getSession();

    const equipmentRepository = this.equipmentRepositories[database];

    const equipments = await equipmentRepository.findByIdInAndUserId(
      equipmentIds,
      userId,
    );

    // const equipments =
    //   await equipmentRepository.findByUserIdAndDataEquipmentIds(
    //     userId,
    //     equipmentIds,
    //   );

    if (equipments.length !== equipmentIds.length) {
      throw new ServerErrorException(INTERNAL_ERROR_CODE.EQUIPMENT_NOT_FOUND);
    }

    await equipmentRepository.deleteByIdIn(equipmentIds);

    return EquipmentDto.fromEntities(equipments);
  }

  /**
   * 아이템 소모
   */
  private async _consumeItem(materials: Material[]): Promise<ItemDto[]> {
    const dataItemIds = materials.map((material) => material.dataId);

    const items = await this._getItem(dataItemIds);

    const updateItems = materials.map((material) => {
      const item = items.find((it) => it.dataItemId === material.dataId);

      if (item.count < material.quantity) {
        throw new ServerErrorException(
          INTERNAL_ERROR_CODE.ITEM_CONSUME_NOT_ENOUGH,
        );
      }

      item.count -= material.quantity;

      return item;
    });

    const { userId, database } = ContextProvider.getSession();
    const itemRepository = this.itemRepositories[database];

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
   * 통화 조회
   */
  private async _getCurrency(): Promise<Currency> {
    const { userId, database } = ContextProvider.getSession();

    const currencyRepository = this.currencyRepositories[database];
    const currency = await currencyRepository.findByUserId(userId);

    if (!currency) {
      throw new ServerErrorException(INTERNAL_ERROR_CODE.CURRENCY_NOT_FOUND);
    }

    return currency;
  }

  /**
   * 아이템 조회
   */
  private async _getItem(dataItemIds: number[]): Promise<Item[]> {
    const { userId, database } = ContextProvider.getSession();

    const itemRepository = this.itemRepositories[database];

    const items = await itemRepository.findByUserIdAndDataItemIdIn(
      userId,
      dataItemIds,
    );

    if (items.length !== dataItemIds.length) {
      throw new ServerErrorException(INTERNAL_ERROR_CODE.ITEM_NOT_FOUND);
    }

    return items;
  }

  /**
   * 소비 병합
   */
  private _mergeMaterials(materials: Material[]): Material[] {
    const materialMap = new Map<string, Material>();

    const stackableMaterials = materials.filter(
      (it) =>
        ![GOODS_TYPE.CHARACTER, GOODS_TYPE.EQUIPMENT].some(
          (type) => type === it.goodsType,
        ),
    );

    for (const material of stackableMaterials) {
      const { goodsType, dataId, quantity } = material;

      const key = `${goodsType}_${dataId}`;

      // goodsType 과 dataId 이 같은 데이터 합치기 (수량 +)
      materialMap.has(key)
        ? (materialMap.get(key).quantity += quantity)
        : materialMap.set(key, {
            goodsType: goodsType,
            dataId: dataId,
            quantity: quantity,
          });
    }

    const unStackableMaterials = materials.filter((it) =>
      [GOODS_TYPE.CHARACTER, GOODS_TYPE.EQUIPMENT].some(
        (type) => type === it.goodsType,
      ),
    );

    return [...materialMap.values(), ...unStackableMaterials];
  }
}
