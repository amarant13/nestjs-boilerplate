import { GameServerConfig } from '../../src/config/game-server.config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmExModule } from '@libs/common/database/typeorm/typeorm-ex.module';
import {
  commonTypeOrmModuleOptions,
  gameTypeOrmModuleOptions,
} from '@libs/common/database/typeorm/typeorm-module.options';
import { User } from '@libs/dao/common/user/user.entity';
import { Currency } from '@libs/dao/game/currency/currency.entity';
import { UserDetail } from '@libs/dao/game/user-detail/user-detail.entity';
import { ConsumptionProvider } from '@libs/common/provider/goods/consumption.provider';
import { RewardProvider } from '@libs/common/provider/goods/reward.provider';
import { UserService } from '../../src/user/user.service';
import { DataCurrencyRepository } from '@libs/dao/static/data-currency/data-currency.repository';
import { SessionModule } from '@libs/dao/redis/session/session.module';
import { UserDetailModule } from '@libs/dao/game/user-detail/user-detail.module';
import { CurrencyModule } from '@libs/dao/game/currency/currency.module';
import { UserModule } from '@libs/dao/common/user/user.module';
import { TestTransactionUtils } from '@libs/common/utils/test/test-transaction.utils';
import { TypeOrmHelper } from '@libs/common/database/typeorm/typeorm.helper';
import { DATABASE_NAME } from '@libs/common/constants/database.constants';
import { TestUserUtils } from '../utils/test-user.utils';
import { TestDataSourceUtils } from '@libs/common/utils/test/test-data-source.utils';
import { TestRedisDataSourceUtils } from '@libs/common/utils/test/test-redis-data-source.utils';
import { GoodsProvider } from '@libs/common/provider/goods/goods.provider';
import {
  CURRENCY_TYPE,
  CurrencyType,
  GOODS_TYPE,
  ITEM_TYPE,
  ItemType,
} from '@libs/common/constants/common.contants';
import { Material, Reward } from '@libs/common/interface/goods.interface';
import {
  CurrencyRepositories,
  CurrencyRepository,
} from '@libs/dao/game/currency/currency.repository';
import { INTERNAL_ERROR_CODE } from '@libs/common/constants/internal-error-code.constants';
import { ContextProvider } from '@libs/common/provider/context.provider';
import { ItemModule } from '@libs/dao/game/item/item.module';
import { DataItemRepository } from '@libs/dao/static/data-item/data-item.repository';
import { Item } from '@libs/dao/game/item/item.entity';
import { CharacterModule } from '@libs/dao/game/character/character.module';
import { EquipmentModule } from '@libs/dao/game/equipment/equipment.module';
import { DataCharacterRepository } from '@libs/dao/static/data-character/data-character.repository';
import { DataEquipmentRepository } from '@libs/dao/static/data-equipment/data-equipment.repository';
import { Character } from '@libs/dao/game/character/character.entity';
import { Equipment } from '@libs/dao/game/equipment/equipment.entity';
import {
  EquipmentRepositories,
  EquipmentRepository,
} from '@libs/dao/game/equipment/equipment.repository';
import {
  CharacterRepositories,
  CharacterRepository,
} from '@libs/dao/game/character/character.repository';
import { UserProvider } from '@libs/common/provider/user.provider';
import { UserDetailProvider } from '@libs/common/provider/user-detail.provider';

describe('Goods provider test', () => {
  let module: TestingModule;
  let userService: UserService;
  let goodsProvider: GoodsProvider;
  let currencyRepositories: CurrencyRepositories;
  let characterRepositories: CharacterRepositories;
  let equipmentRepositories: EquipmentRepositories;

  let userId: number;
  let gameDbId: number;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        GameServerConfig,
        TypeOrmExModule.forRoot({
          ...commonTypeOrmModuleOptions,
          entities: [User],
        }),
        ...Object.values(gameTypeOrmModuleOptions).map((dataSource) => {
          return TypeOrmExModule.forRoot({
            ...dataSource,
            entities: [UserDetail, Currency, Character, Equipment, Item],
          });
        }),

        SessionModule,

        UserModule,
        UserDetailModule,
        CurrencyModule,
        CharacterModule,
        EquipmentModule,
        ItemModule,
      ],
      providers: [
        // service
        UserService,

        // provider
        RewardProvider,
        ConsumptionProvider,
        GoodsProvider,
        UserProvider,
        UserDetailProvider,

        // repository
        DataCurrencyRepository,
        DataCharacterRepository,
        DataEquipmentRepository,
        DataItemRepository,
      ],
    }).compile();

    goodsProvider = module.get<GoodsProvider>(GoodsProvider);
    userService = module.get<UserService>(UserService);

    currencyRepositories = module.get<CurrencyRepositories>(CurrencyRepository);
    characterRepositories =
      module.get<CharacterRepositories>(CharacterRepository);
    equipmentRepositories =
      module.get<EquipmentRepositories>(EquipmentRepository);

    userId = 1;
    gameDbId = 101;
  });

  beforeEach(async () => {
    await TypeOrmHelper.Transactional([
      DATABASE_NAME.USER,
      ...Object.values(gameTypeOrmModuleOptions).map((it) => it.database),
    ]);

    await TestUserUtils.login(userId, gameDbId);

    await userService.createUserDetail({
      nickName: 'test',
    });
  });

  afterEach(async () => {
    await TestTransactionUtils.rollback();
  });

  afterAll(async () => {
    await Promise.all([
      TestDataSourceUtils.clearDataSource(module),

      TestRedisDataSourceUtils.clearRedisDataSource(module),
    ]);
  });

  it('Goods provider defined test', async () => {
    expect(goodsProvider).toBeDefined();
  });

  it('없는 데이터로 보상 및 소비', async () => {
    const consume = createData(CURRENCY_TYPE.DIAMOND, 1000);

    try {
      await goodsProvider.consume([consume]);
      fail('CURRENCY_NOT_FOUND not thrown');
    } catch (e) {
      expect(e.response).toEqual(INTERNAL_ERROR_CODE.CURRENCY_NOT_FOUND);
    }

    // 존재하지 않는 데이터 보상
    const reward = createData(CURRENCY_TYPE.DIAMOND, 1000);

    try {
      await goodsProvider.pay([reward]);
      fail('DATA_INVALID not thrown');
    } catch (e) {
      expect(e.response).toEqual(INTERNAL_ERROR_CODE.DATA_INVALID);
    }

    try {
      await goodsProvider.consume([consume]);
      fail('CURRENCY_NOT_FOUND not thrown');
    } catch (e) {
      expect(e.response).toEqual(INTERNAL_ERROR_CODE.CURRENCY_NOT_FOUND);
    }
  });

  it('data 존재하지만 type 은 없는 경우', async () => {
    const unKnownType: Reward = {
      goodsType: GOODS_TYPE.CURRENCY,
      dataId: 300002,
      quantity: 10,
    };

    try {
      await goodsProvider.pay([unKnownType]);
      fail('CURRENCY_UNKNOWN_TYPE not thrown');
    } catch (e) {
      expect(e.response).toEqual(INTERNAL_ERROR_CODE.CURRENCY_UNKNOWN_TYPE);
    }

    try {
      await goodsProvider.consume([unKnownType]);
      fail('CURRENCY_NOT_FOUND not thrown');
    } catch (e) {
      expect(e.response).toEqual(INTERNAL_ERROR_CODE.CURRENCY_NOT_FOUND);
    }

    // 유저가 가지고 있지만 consume 할때 type 이 존재 하지 않을때
    // insert 로 지급
    const { database } = ContextProvider.getSession();

    const currencyRepository = currencyRepositories[database];

    const insertDiamond = await currencyRepository.insert(
      Currency.create({
        userId: userId,
        gold: 0,
        cash: 0,
        diamond: 10,
      }),
    );

    expect(insertDiamond).toBeDefined();

    const checkDiamond = await currencyRepository.findByUserId(userId);

    expect(checkDiamond.diamond).toEqual(10);
    expect(checkDiamond.gold).toEqual(0);
    expect(checkDiamond.cash).toEqual(0);

    const consumeDiamond: Material = {
      goodsType: GOODS_TYPE.CURRENCY,
      dataId: 300002,
      quantity: 8,
    };

    try {
      await goodsProvider.consume([consumeDiamond]);
      fail('CURRENCY_UNKNOWN_TYPE not thrown');
    } catch (e) {
      expect(e.response).toEqual(INTERNAL_ERROR_CODE.CURRENCY_UNKNOWN_TYPE);
    }
  });

  it('goods provider 캐쉬 & 골드 보상 및 소비', async () => {
    // 캐쉬 & 골드 수량 음수(-) 보상
    const rewardMinusCash = createData(CURRENCY_TYPE.CASH, -100);
    const rewardMinusGold = createData(CURRENCY_TYPE.GOLD, -50);

    try {
      await goodsProvider.pay([rewardMinusCash, rewardMinusGold]);
      fail('DATA_INVALID not thrown');
    } catch (e) {
      expect(e.response).toEqual(INTERNAL_ERROR_CODE.DATA_INVALID);
    }

    // 캐쉬 & 골드 보상
    const rewardCash = createData(CURRENCY_TYPE.CASH, 50);
    const rewardGold = createData(CURRENCY_TYPE.GOLD, 20);

    // Dto test
    const rewardGoodsOutDto = await goodsProvider.pay([rewardCash, rewardGold]);

    expect(rewardGoodsOutDto.currency.cash).toEqual(50);
    expect(rewardGoodsOutDto.currency.gold).toEqual(20);

    // 캐쉬 & 골드 소모
    const consumeCash = createData(CURRENCY_TYPE.CASH, 44);
    const consumeGold = createData(CURRENCY_TYPE.GOLD, 5);

    const consumptionGoodsOutDto = await goodsProvider.consume([
      consumeCash,
      consumeGold,
    ]);

    // Dto test
    expect(consumptionGoodsOutDto.currency.cash).toEqual(6);
    expect(consumptionGoodsOutDto.currency.gold).toEqual(15);
  });

  it('goods provider 캐쉬 보상 및 소비 - 보상보다 많게 소비', async () => {
    // 캐쉬 보상
    const rewardGold = createData(CURRENCY_TYPE.CASH, 50);

    // Dto test
    const rewardGoodsOutDto = await goodsProvider.pay([rewardGold]);

    expect(rewardGoodsOutDto.currency.cash).toEqual(50);

    // 캐쉬 소모
    const consumeCash = createData(CURRENCY_TYPE.CASH, 55);

    try {
      await goodsProvider.consume([consumeCash]);
      fail('CURRENCY_CASH_NOT_ENOUGH');
    } catch (e) {
      expect(e.response).toEqual(INTERNAL_ERROR_CODE.CURRENCY_CASH_NOT_ENOUGH);
    }
  });

  it('goods provider 골드 보상 및 소비 - 보상보다 많게 소비', async () => {
    // 골드 보상
    const rewardGold = createData(CURRENCY_TYPE.GOLD, 50);

    // Dto test
    const rewardGoodsOutDto = await goodsProvider.pay([rewardGold]);

    expect(rewardGoodsOutDto.currency.gold).toEqual(50);

    // 골드 소모
    const consumeGold = createData(CURRENCY_TYPE.GOLD, 55);

    try {
      await goodsProvider.consume([consumeGold]);
      fail('CURRENCY_GOLD_NOT_ENOUGH');
    } catch (e) {
      expect(e.response).toEqual(INTERNAL_ERROR_CODE.CURRENCY_GOLD_NOT_ENOUGH);
    }
  });

  it('중복 제거 함수 확인', () => {
    const rewardGold1 = createData(CURRENCY_TYPE.GOLD, 1);
    const rewardCash1 = createData(CURRENCY_TYPE.CASH, 1);
    const rewardCash2 = createData(CURRENCY_TYPE.CASH, 1);
    const rewardGold2 = createData(CURRENCY_TYPE.GOLD, 1);
    const rewardCash3 = createData(CURRENCY_TYPE.CASH, 1);
    const rewardGold3 = createData(CURRENCY_TYPE.GOLD, 1);
    const rewardCash4 = createData(CURRENCY_TYPE.CASH, 1);
    const rewardGold4 = createData(CURRENCY_TYPE.GOLD, 1);
    const rewardGold5 = createData(CURRENCY_TYPE.GOLD, 1);
    const rewardCash5 = createData(CURRENCY_TYPE.CASH, 1);

    const rewards: Reward[] = [
      rewardGold1,
      rewardCash1,
      rewardGold2,
      rewardGold3,
      rewardCash2,
      rewardCash3,
      rewardGold4,
      rewardCash4,
      rewardGold5,
      rewardCash5,
    ];

    const result = margeRewards(rewards);
    expect(result.length).toBe(2);

    expect(result[0].goodsType).toBe(GOODS_TYPE.CURRENCY);
    expect(result[0].dataId).toBe(300001);
    expect(result[0].quantity).toBe(5);

    expect(result[1].goodsType).toBe(GOODS_TYPE.CURRENCY);
    expect(result[1].dataId).toBe(300000);
    expect(result[1].quantity).toBe(5);
  });

  it('currency 중복 제거 테스트 - 같은 아이템이면 quantity 만 합쳐서 나와야됨', async () => {
    // 보상 중복 제거
    const rewardGold1 = createData(CURRENCY_TYPE.GOLD, 1);
    const rewardCash1 = createData(CURRENCY_TYPE.CASH, 1);
    const rewardCash2 = createData(CURRENCY_TYPE.CASH, 1);
    const rewardGold2 = createData(CURRENCY_TYPE.GOLD, 1);
    const rewardCash3 = createData(CURRENCY_TYPE.CASH, 1);
    const rewardGold3 = createData(CURRENCY_TYPE.GOLD, 1);
    const rewardCash4 = createData(CURRENCY_TYPE.CASH, 1);
    const rewardGold4 = createData(CURRENCY_TYPE.GOLD, 1);
    const rewardGold5 = createData(CURRENCY_TYPE.GOLD, 1);
    const rewardCash5 = createData(CURRENCY_TYPE.CASH, 1);

    const rewards: Reward[] = [
      rewardGold1,
      rewardCash1,
      rewardGold2,
      rewardGold3,
      rewardCash2,
      rewardCash3,
      rewardGold4,
      rewardCash4,
      rewardGold5,
      rewardCash5,
    ];

    // Dto test
    const rewardGoodsOutDto = await goodsProvider.pay(rewards);

    expect(rewardGoodsOutDto.currency.cash).toEqual(5);
    expect(rewardGoodsOutDto.currency.gold).toEqual(5);

    // 소모 중복 제거
    const consumeGold1 = createData(CURRENCY_TYPE.GOLD, 1);
    const consumeCash1 = createData(CURRENCY_TYPE.CASH, 1);
    const consumeGold2 = createData(CURRENCY_TYPE.GOLD, 1);
    const consumeCash2 = createData(CURRENCY_TYPE.CASH, 1);
    const consumeGold3 = createData(CURRENCY_TYPE.GOLD, 1);
    const consumeCash3 = createData(CURRENCY_TYPE.CASH, 1);
    const consumeCash4 = createData(CURRENCY_TYPE.CASH, 1);
    const consumeGold4 = createData(CURRENCY_TYPE.GOLD, 1);
    const consumeGold5 = createData(CURRENCY_TYPE.GOLD, 1);
    const consumeCash5 = createData(CURRENCY_TYPE.CASH, 1);

    const materials: Material[] = [
      consumeCash1,
      consumeGold1,
      consumeCash2,
      consumeGold2,
      consumeGold3,
      consumeCash3,
      consumeGold4,
      consumeCash4,
      consumeCash5,
      consumeGold5,
    ];

    // Dto test
    const consumptionGoodsOutDto = await goodsProvider.consume(materials);

    expect(consumptionGoodsOutDto.currency.cash).toEqual(0);
    expect(consumptionGoodsOutDto.currency.gold).toEqual(0);
  });

  /**
   * 캐릭터
   */
  it('캐릭터 goods provider', async () => {
    const createInvalidCharacterData1 = {
      goodsType: GOODS_TYPE.CHARACTER,
      dataId: 101001,
      quantity: -1,
    };

    try {
      await goodsProvider.pay([createInvalidCharacterData1]);
      fail('DATA_INVALID not thrown');
    } catch (e) {
      expect(e.response).toEqual(INTERNAL_ERROR_CODE.DATA_INVALID);
    }

    const createInvalidCharacterData2 = {
      goodsType: GOODS_TYPE.CHARACTER,
      dataId: 0,
      quantity: 10,
    };

    try {
      await goodsProvider.pay([createInvalidCharacterData2]);
      fail('DATA_INVALID not thrown');
    } catch (e) {
      expect(e.response).toEqual(INTERNAL_ERROR_CODE.DATA_INVALID);
    }

    const createCharacterReward1 = {
      goodsType: GOODS_TYPE.CHARACTER,
      dataId: 101001,
      quantity: 5,
    };

    const rewardsGoodsOutDto = await goodsProvider.pay([
      createCharacterReward1,
    ]);

    expect(rewardsGoodsOutDto.characters.length).toEqual(5);

    expect(rewardsGoodsOutDto.characters[0].dataCharacterId).toEqual(101001);

    // dataId 가 아니라 pk id 이여야됨
    const createCharacterConsume1 = {
      goodsType: GOODS_TYPE.CHARACTER,
      id: rewardsGoodsOutDto.characters[0].id,
    };

    const consumeGoodsOutDto = await goodsProvider.consume([
      createCharacterConsume1,
    ]);

    expect(consumeGoodsOutDto.consumedCharacterIds.length).toEqual(1);

    const { userId, database } = ContextProvider.getSession();

    const characterRepository = characterRepositories[database];

    const checkRemainCharacters =
      await characterRepository.findByUserId(userId);

    expect(checkRemainCharacters.length).toEqual(4);
    expect(checkRemainCharacters[0].dataCharacterId).toEqual(101001);
  });

  /**
   * 장비
   */
  it('장비 goods provider', async () => {
    const createInvalidEquipmentData1 = {
      goodsType: GOODS_TYPE.EQUIPMENT,
      dataId: 2201001,
      quantity: -1,
    };

    try {
      await goodsProvider.pay([createInvalidEquipmentData1]);
      fail('DATA_INVALID not thrown');
    } catch (e) {
      expect(e.response).toEqual(INTERNAL_ERROR_CODE.DATA_INVALID);
    }

    const createInvalidEquipmentData2 = {
      goodsType: GOODS_TYPE.CHARACTER,
      dataId: 0,
      quantity: 10,
    };

    try {
      await goodsProvider.pay([createInvalidEquipmentData2]);
      fail('DATA_INVALID not thrown');
    } catch (e) {
      expect(e.response).toEqual(INTERNAL_ERROR_CODE.DATA_INVALID);
    }

    const createEquipmentReward1 = {
      goodsType: GOODS_TYPE.EQUIPMENT,
      dataId: 2201001,
      quantity: 5,
    };

    const rewardsGoodsOutDto = await goodsProvider.pay([
      createEquipmentReward1,
    ]);

    expect(rewardsGoodsOutDto.equipments.length).toEqual(5);

    expect(rewardsGoodsOutDto.equipments[0].dataEquipmentId).toEqual(2201001);

    const createEquipmentConsume1 = {
      goodsType: GOODS_TYPE.EQUIPMENT,
      id: rewardsGoodsOutDto.equipments[0].id,
    };

    const consumeGoodsOutDto = await goodsProvider.consume([
      createEquipmentConsume1,
    ]);

    expect(consumeGoodsOutDto.consumedEquipmentIds.length).toEqual(1);

    const { userId, database } = ContextProvider.getSession();

    const equipmentRepository = equipmentRepositories[database];

    const checkRemainEquipments =
      await equipmentRepository.findByUserId(userId);

    expect(checkRemainEquipments.length).toEqual(4);
    expect(checkRemainEquipments[0].dataEquipmentId).toEqual(2201001);
  });

  /**
   * 아이템
   */
  it('아이템 소모', async () => {
    // 아이템 음수로 소모
    const createMinusItem = createItemData(ITEM_TYPE.MATERIAL, -50);

    try {
      await goodsProvider.consume([createMinusItem]);
      fail('DATA_INVALID not thrown');
    } catch (e) {
      expect(e.response).toEqual(INTERNAL_ERROR_CODE.DATA_INVALID);
    }

    // 없는 아이템 소비
    const createNoRewardItem = createItemData(ITEM_TYPE.MATERIAL, 50);

    try {
      await goodsProvider.consume([createNoRewardItem]);
      fail('ITEM_NOT_FOUND not thrown');
    } catch (e) {
      expect(e.response).toEqual(INTERNAL_ERROR_CODE.ITEM_NOT_FOUND);
    }

    // 보상
    const rewardItemData1 = createItemData(ITEM_TYPE.MATERIAL, 50);
    const rewardItemData2 = createItemData(ITEM_TYPE.TICKET, 10);
    const rewardItemData3 = createItemData(ITEM_TYPE.COIN, 20);

    const rewardItems: Reward[] = [
      rewardItemData1,
      rewardItemData2,
      rewardItemData3,
    ];

    // Dto test
    const rewardGoodsOutDto = await goodsProvider.pay(rewardItems);

    expect(rewardGoodsOutDto.items.length).toEqual(3);

    // Material
    expect(rewardGoodsOutDto.items[0].dataItemId).toEqual(
      rewardItemData1.dataId,
    );
    expect(rewardGoodsOutDto.items[0].count).toEqual(50);

    // Ticket
    expect(rewardGoodsOutDto.items[1].dataItemId).toEqual(
      rewardItemData2.dataId,
    );
    expect(rewardGoodsOutDto.items[1].count).toEqual(10);

    // Coin
    expect(rewardGoodsOutDto.items[2].dataItemId).toEqual(
      rewardItemData3.dataId,
    );
    expect(rewardGoodsOutDto.items[2].count).toEqual(20);

    // 가지고 있는 아이템보다 많게 소모
    const createManyItemConsume = createItemData(ITEM_TYPE.TICKET, 15);

    try {
      await goodsProvider.consume([createManyItemConsume]);
      fail('ITEM_CONSUME_NOT_ENOUGH not thrown');
    } catch (e) {
      expect(e.response).toEqual(INTERNAL_ERROR_CODE.ITEM_CONSUME_NOT_ENOUGH);
    }

    const consumeItemData1 = createItemData(ITEM_TYPE.MATERIAL, 10);
    const consumeItemData2 = createItemData(ITEM_TYPE.TICKET, 10);
    const consumeItemData3 = createItemData(ITEM_TYPE.COIN, 10);

    const consumeItems: Material[] = [
      consumeItemData1,
      consumeItemData2,
      consumeItemData3,
    ];

    // Dto test
    const consumptionGoodsOutDto = await goodsProvider.consume(consumeItems);
    expect(consumptionGoodsOutDto.items.length).toEqual(3);

    // Material
    expect(consumptionGoodsOutDto.items[0].dataItemId).toEqual(
      consumeItemData1.dataId,
    );
    expect(consumptionGoodsOutDto.items[0].count).toEqual(40);

    // Ticket
    expect(consumptionGoodsOutDto.items[1].dataItemId).toEqual(
      consumeItemData2.dataId,
    );
    expect(consumptionGoodsOutDto.items[1].count).toEqual(0);

    // Coin
    expect(consumptionGoodsOutDto.items[2].dataItemId).toEqual(
      consumeItemData3.dataId,
    );
    expect(consumptionGoodsOutDto.items[2].count).toEqual(10);
  });

  it('아이템 중복 보상, 소모 확인', async () => {
    const rewardDupItem1 = createItemData(ITEM_TYPE.MATERIAL, 50);
    const rewardDupItem2 = createItemData(ITEM_TYPE.MATERIAL, 50);

    const duplicateRewardItem: Reward[] = [rewardDupItem1, rewardDupItem2];

    // Dto test
    const rewardGoodsOutDto = await goodsProvider.pay(duplicateRewardItem);

    expect(rewardGoodsOutDto.items.length).toEqual(1);

    expect(rewardGoodsOutDto.items[0].dataItemId).toEqual(
      rewardDupItem1.dataId,
    );

    expect(rewardGoodsOutDto.items[0].count).toEqual(100);

    const consumeDupItem1 = createItemData(ITEM_TYPE.MATERIAL, 10);
    const consumeDupItem2 = createItemData(ITEM_TYPE.MATERIAL, 20);

    const duplicateConsume: Material[] = [consumeDupItem1, consumeDupItem2];

    // Dto test
    const consumptionGoodsOutDto =
      await goodsProvider.consume(duplicateConsume);

    expect(consumptionGoodsOutDto.items.length).toBe(1);

    expect(consumptionGoodsOutDto.items[0].dataItemId).toBe(
      consumeDupItem1.dataId,
    );

    expect(consumptionGoodsOutDto.items[0].count).toBe(70);
  });

  // 보상, 소모 데이터 만들때 사용
  const createData = (currencyType: CurrencyType, quantity: number) => {
    let dataId: number;

    if (currencyType === CURRENCY_TYPE.CASH) {
      dataId = 300000;
    }

    if (currencyType === CURRENCY_TYPE.GOLD) {
      dataId = 300001;
    }

    return {
      goodsType: GOODS_TYPE.CURRENCY,
      dataId: dataId,
      quantity: quantity,
    };
  };

  const createItemData = (itemType: ItemType, quantity: number) => {
    let dataId: number;

    if (itemType === ITEM_TYPE.MATERIAL) {
      dataId = 200000;
    }

    if (itemType === ITEM_TYPE.TICKET) {
      dataId = 200001;
    }

    if (itemType === ITEM_TYPE.COIN) {
      dataId = 200002;
    }

    return { goodsType: GOODS_TYPE.ITEM, dataId: dataId, quantity: quantity };
  };

  const margeRewards = (rewards: Reward[]): Reward[] => {
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
  };
});
