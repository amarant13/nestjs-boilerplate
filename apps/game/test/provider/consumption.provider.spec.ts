import { GameServerConfig } from '../../src/config/game-server.config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmExModule } from '@libs/common/database/typeorm/typeorm-ex.module';
import {
  commonTypeOrmModuleOptions,
  gameTypeOrmModuleOptions,
} from '@libs/common/database/typeorm/typeorm-module.options';
import { TypeOrmHelper } from '@libs/common/database/typeorm/typeorm.helper';
import { DATABASE_NAME } from '@libs/common/constants/database.constants';
import { TestUserUtils } from '../utils/test-user.utils';
import { TestTransactionUtils } from '@libs/common/utils/test/test-transaction.utils';
import { TestDataSourceUtils } from '@libs/common/utils/test/test-data-source.utils';
import { TestRedisDataSourceUtils } from '@libs/common/utils/test/test-redis-data-source.utils';
import { UserDetail } from '@libs/dao/game/user-detail/user-detail.entity';
import { Currency } from '@libs/dao/game/currency/currency.entity';
import { RewardProvider } from '@libs/common/provider/goods/reward.provider';
import { ConsumptionProvider } from '@libs/common/provider/goods/consumption.provider';
import { UserService } from '../../src/user/user.service';
import {
  CurrencyRepositories,
  CurrencyRepository,
} from '@libs/dao/game/currency/currency.repository';
import { User } from '@libs/dao/common/user/user.entity';
import { SessionModule } from '@libs/dao/redis/session/session.module';
import { UserModule } from '@libs/dao/common/user/user.module';
import { UserDetailModule } from '@libs/dao/game/user-detail/user-detail.module';
import { CurrencyModule } from '@libs/dao/game/currency/currency.module';
import { DataCurrencyRepository } from '@libs/dao/static/data-currency/data-currency.repository';
import { INTERNAL_ERROR_CODE } from '@libs/common/constants/internal-error-code.constants';
import { Material, Reward } from '@libs/common/interface/goods.interface';
import { ContextProvider } from '@libs/common/provider/context.provider';
import {
  CURRENCY_TYPE,
  CurrencyType,
  GOODS_TYPE,
  ITEM_TYPE,
  ItemType,
} from '@libs/common/constants/common.contants';
import { ItemModule } from '@libs/dao/game/item/item.module';
import { DataItemRepository } from '@libs/dao/static/data-item/data-item.repository';
import { Item } from '@libs/dao/game/item/item.entity';
import {
  ItemRepositories,
  ItemRepository,
} from '@libs/dao/game/item/item.repository';
import {
  EquipmentRepositories,
  EquipmentRepository,
} from '@libs/dao/game/equipment/equipment.repository';
import { Equipment } from '@libs/dao/game/equipment/equipment.entity';
import { EquipmentModule } from '@libs/dao/game/equipment/equipment.module';
import { DataEquipmentRepository } from '@libs/dao/static/data-equipment/data-equipment.repository';
import { CharacterModule } from '@libs/dao/game/character/character.module';
import { DataCharacterRepository } from '@libs/dao/static/data-character/data-character.repository';
import { Character } from '@libs/dao/game/character/character.entity';
import {
  CharacterRepositories,
  CharacterRepository,
} from '@libs/dao/game/character/character.repository';
import { GoodsProvider } from '@libs/common/provider/goods/goods.provider';
import { UserProvider } from '@libs/common/provider/user.provider';
import { UserDetailProvider } from '@libs/common/provider/user-detail.provider';

describe('Consumption Provider test', () => {
  let module: TestingModule;
  let goodsProvider: GoodsProvider;
  let consumptionProvider: ConsumptionProvider;
  let userService: UserService;
  let currencyRepositories: CurrencyRepositories;
  let characterRepositories: CharacterRepositories;
  let equipmentRepositories: EquipmentRepositories;
  let itemRepositories: ItemRepositories;

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
            entities: [UserDetail, Currency, Item, Character, Equipment],
          });
        }),

        SessionModule,

        // dao
        UserModule,
        UserDetailModule,
        CurrencyModule,
        ItemModule,
        CharacterModule,
        EquipmentModule,
      ],
      providers: [
        // service
        UserService,

        // provider
        GoodsProvider,
        RewardProvider,
        ConsumptionProvider,
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
    consumptionProvider = module.get<ConsumptionProvider>(ConsumptionProvider);
    userService = module.get<UserService>(UserService);

    currencyRepositories = module.get<CurrencyRepositories>(CurrencyRepository);
    characterRepositories =
      module.get<CharacterRepositories>(CharacterRepository);
    itemRepositories = module.get<ItemRepositories>(ItemRepository);
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

    await userService.createUserDetail({ nickName: 'test' });
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

  it('Consumption provider defined check', async () => {
    expect(consumptionProvider).toBeDefined();
  });

  /**
   * 통화 소모 테스트
   */
  it('골드 보상 후 골드, 캐쉬 소모', async () => {
    // 골드 보상 후 확인
    const rewards: Reward[] = [];

    const rewardGold = createCurrencyData(CURRENCY_TYPE.GOLD, 10);

    rewards.push(rewardGold);

    await goodsProvider.pay(rewards);

    const { database } = ContextProvider.getSession();
    const currencyRepository = currencyRepositories[database];

    const checkRewardGold = await currencyRepository.findByUserId(userId);

    expect(checkRewardGold).toBeDefined();
    expect(checkRewardGold.userId).toBe(userId);
    expect(checkRewardGold.gold).toBe(10);
    expect(checkRewardGold.cash).toBe(0);

    // 캐쉬 소모
    const consumeCash: Material = createCurrencyData(CURRENCY_TYPE.CASH, 7);

    try {
      await consumptionProvider.consume([consumeCash]);
      fail('CURRENCY_CASH_NOT_ENOUGH not thrown');
    } catch (e) {
      expect(e.response).toEqual(INTERNAL_ERROR_CODE.CURRENCY_CASH_NOT_ENOUGH);
    }

    // 골드 소모
    const consumeGold: Material = createCurrencyData(CURRENCY_TYPE.GOLD, 3);

    await consumptionProvider.consume([consumeGold]);

    const checkConsumeGold = await currencyRepository.findByUserId(userId);

    expect(checkConsumeGold).toBeDefined();
    expect(checkConsumeGold.userId).toBe(userId);
    expect(checkConsumeGold.gold).toBe(7);
    expect(checkConsumeGold.cash).toBe(0);
  });

  it('가지고 있는 골드 캐쉬 보다 많이 소모', async () => {
    // 골드 보상 후 확인
    const rewards: Reward[] = [];

    const rewardGold = createCurrencyData(CURRENCY_TYPE.GOLD, 10);

    const rewardCash = createCurrencyData(CURRENCY_TYPE.CASH, 10);

    rewards.push(rewardGold, rewardCash);

    await goodsProvider.pay(rewards);

    const { database } = ContextProvider.getSession();
    const currencyRepository = currencyRepositories[database];

    const checkRewardGold = await currencyRepository.findByUserId(userId);

    expect(checkRewardGold).toBeDefined();
    expect(checkRewardGold.userId).toBe(userId);
    expect(checkRewardGold.gold).toBe(10);
    expect(checkRewardGold.cash).toBe(10);

    // 캐쉬 소모
    const materials: Material[] = [];

    const consumeCash: Material = createCurrencyData(CURRENCY_TYPE.CASH, 20);

    const consumeGold: Material = createCurrencyData(CURRENCY_TYPE.GOLD, 20);

    materials.push(consumeCash, consumeGold);

    try {
      await consumptionProvider.consume(materials);
      fail('CURRENCY_CASH_NOT_ENOUGH not thrown');
    } catch (e) {
      expect(e.response).toEqual(INTERNAL_ERROR_CODE.CURRENCY_CASH_NOT_ENOUGH);
    }
  });

  it('골드, 캐쉬 보상 후 두 가지 소모 test', async () => {
    // 골드 보상 후 확인
    const rewards: Reward[] = [];

    const rewardGold = createCurrencyData(CURRENCY_TYPE.GOLD, 10);
    const rewardCash1 = createCurrencyData(CURRENCY_TYPE.CASH, 10);
    const rewardCash2 = createCurrencyData(CURRENCY_TYPE.CASH, 10);

    rewards.push(rewardGold, rewardCash1, rewardCash2);

    await goodsProvider.pay(rewards);

    const { database } = ContextProvider.getSession();

    const currencyRepository = currencyRepositories[database];

    const checkAllReward = await currencyRepository.findByUserId(userId);

    expect(checkAllReward).toBeDefined();
    expect(checkAllReward.userId).toEqual(userId);

    expect(checkAllReward.cash).toEqual(20);
    expect(checkAllReward.gold).toEqual(10);

    const materials: Material[] = [];

    const consumeCash1 = createCurrencyData(CURRENCY_TYPE.CASH, 10);
    const consumeCash2 = createCurrencyData(CURRENCY_TYPE.CASH, 10);
    const consumeGold = createCurrencyData(CURRENCY_TYPE.GOLD, 5);

    materials.push(consumeGold, consumeCash1, consumeCash2);

    await consumptionProvider.consume(materials);

    const checkAllConsume = await currencyRepository.findByUserId(userId);

    expect(checkAllConsume).toBeDefined();

    expect(checkAllConsume.cash).toEqual(0);
    expect(checkAllConsume.gold).toEqual(5);
  });

  /**
   * 캐락터 소모
   */
  it('캐릭터 소모', async () => {
    const createCharacterData = [
      {
        goodsType: GOODS_TYPE.CHARACTER,
        dataId: 101001,
        quantity: 1,
      },
      {
        goodsType: GOODS_TYPE.CHARACTER,
        dataId: 101001,
        quantity: 3,
      },
      {
        goodsType: GOODS_TYPE.CHARACTER,
        dataId: 101001,
        quantity: 1,
      },
    ];

    const goodsOutDto = await goodsProvider.pay(createCharacterData);

    expect(goodsOutDto.characters.length).toEqual(5);

    const { userId, database } = ContextProvider.getSession();

    const characterRepository = characterRepositories[database];

    const characters =
      await characterRepository.findByUserIdAndDataCharacterIdIn(userId, [
        createCharacterData[0].dataId,
      ]);

    expect(characters.length).toEqual(5);

    const checkCharacterReward =
      await characterRepository.findByUserIdAndDataCharacterId(
        userId,
        createCharacterData[0].dataId,
      );

    expect(checkCharacterReward[0].dataCharacterId).toEqual(101001);

    const createConsumeCharacter = {
      goodsType: GOODS_TYPE.CHARACTER,
      id: checkCharacterReward[0].id,
    };

    const charactersDto = await consumptionProvider.consume([
      createConsumeCharacter,
    ]);

    expect(charactersDto.length).toEqual(1);
    expect(charactersDto[0].id).toEqual(createConsumeCharacter.id);
  });

  /**
   * 장비 소모
   */
  it('장비 소모', async () => {
    // 장비 보상
    const createRewardEquipment1 = [
      {
        goodsType: GOODS_TYPE.EQUIPMENT,
        dataId: 2201001,
        quantity: 1,
      },
      {
        goodsType: GOODS_TYPE.EQUIPMENT,
        dataId: 2201001,
        quantity: 3,
      },
      {
        goodsType: GOODS_TYPE.EQUIPMENT,
        dataId: 2201001,
        quantity: 1,
      },
    ];

    const createRewardEquipment2 = {
      goodsType: GOODS_TYPE.EQUIPMENT,
      dataId: 2201002,
      quantity: 5,
    };

    const goodsOutDto = await goodsProvider.pay([
      ...createRewardEquipment1,
      createRewardEquipment2,
    ]);

    expect(goodsOutDto.equipments.length).toBe(10);

    const { userId, database } = ContextProvider.getSession();

    const equipmentRepository = equipmentRepositories[database];

    const equipments =
      await equipmentRepository.findByUserIdAndDataEquipmentIdIn(userId, [
        createRewardEquipment1[0].dataId,
        createRewardEquipment2.dataId,
      ]);
    expect(equipments.length).toBe(10);

    const checkRewardEquipment1 =
      await equipmentRepository.findByUserIdAndDataEquipmentId(
        userId,
        createRewardEquipment1[0].dataId,
      );

    const checkRewardEquipment2 =
      await equipmentRepository.findByUserIdAndDataEquipmentId(
        userId,
        createRewardEquipment2.dataId,
      );

    expect(checkRewardEquipment1[0].dataEquipmentId).toEqual(2201001);
    expect(checkRewardEquipment2[0].dataEquipmentId).toEqual(2201002);

    const createConsumeEquipment1 = {
      goodsType: GOODS_TYPE.EQUIPMENT,
      id: checkRewardEquipment1[0].id,
    };

    const createConsumeEquipment2 = {
      goodsType: GOODS_TYPE.EQUIPMENT,
      id: checkRewardEquipment2[0].id,
    };

    const equipmentsDto = await consumptionProvider.consume([
      createConsumeEquipment1,
      createConsumeEquipment2,
    ]);

    expect(equipmentsDto.length).toEqual(2);
    expect(equipmentsDto[0].id).toEqual(createConsumeEquipment1.id);
    expect(equipmentsDto[1].id).toEqual(createConsumeEquipment2.id);
  });

  /**
   * 아이템 소모 테스트
   */
  it('아이템 소모', async () => {
    // 보상 안받은 아이템 소모 시도
    const createNoRewardItem = createItemData(ITEM_TYPE.MATERIAL, 50);

    try {
      await consumptionProvider.consume([createNoRewardItem]);
      fail('ITEM_NOT_FOUND not thrown');
    } catch (e) {
      expect(e.response).toEqual(INTERNAL_ERROR_CODE.ITEM_NOT_FOUND);
    }

    // material, ticket 소모
    const createItemReward1 = createItemData(ITEM_TYPE.MATERIAL, 10);
    const createItemReward2 = createItemData(ITEM_TYPE.TICKET, 10);

    const rewardItem: Reward[] = [createItemReward1, createItemReward2];

    await goodsProvider.pay(rewardItem);

    const { database } = ContextProvider.getSession();

    const itemRepository = itemRepositories[database];

    const checkItemReward = await itemRepository.findByUserId(userId);

    const checkItemReward1 = await itemRepository.findByUserIdAndDataItemId(
      userId,
      createItemReward1.dataId,
    );

    const checkItemReward2 = await itemRepository.findByUserIdAndDataItemId(
      userId,
      createItemReward2.dataId,
    );

    expect(checkItemReward).toBeDefined();
    expect(checkItemReward.length).toEqual(2);
    expect(checkItemReward1.count).toEqual(10);
    expect(checkItemReward2.count).toEqual(10);

    // 가지고 있는 아이템보다 많게 소모 exception
    const createManyItemConsume = createItemData(ITEM_TYPE.MATERIAL, 15);

    try {
      await consumptionProvider.consume([createManyItemConsume]);
      fail('ITEM_CONSUME_NOT_ENOUGH not thrown');
    } catch (e) {
      expect(e.response).toEqual(INTERNAL_ERROR_CODE.ITEM_CONSUME_NOT_ENOUGH);
    }

    // 아이템 정상 소모
    const itemConsume1 = createItemData(ITEM_TYPE.MATERIAL, 5);
    const itemConsume2 = createItemData(ITEM_TYPE.TICKET, 5);

    await consumptionProvider.consume([itemConsume1, itemConsume2]);

    const checkUserItems = await itemRepository.findByUserId(userId);

    const checkUserItem1 = await itemRepository.findByUserIdAndDataItemId(
      userId,
      itemConsume1.dataId,
    );

    const checkUserItem2 = await itemRepository.findByUserIdAndDataItemId(
      userId,
      itemConsume2.dataId,
    );

    expect(checkUserItems.length).toEqual(2);
    expect(checkUserItem1.count).toEqual(5);
    expect(checkUserItem2.count).toEqual(5);
  });

  // 보상, 소모 데이터 만들때 사용
  const createCurrencyData = (currencyType: CurrencyType, quantity: number) => {
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

    return {
      goodsType: GOODS_TYPE.ITEM,
      dataId: dataId,
      quantity: quantity,
    };
  };
});
