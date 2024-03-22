import { GameServerConfig } from '../../src/config/game-server.config';
import { Test, TestingModule } from '@nestjs/testing';
import { RewardProvider } from '@libs/common/provider/goods/reward.provider';
import { TypeOrmExModule } from '@libs/common/database/typeorm/typeorm-ex.module';
import {
  commonTypeOrmModuleOptions,
  gameTypeOrmModuleOptions,
} from '@libs/common/database/typeorm/typeorm-module.options';
import { User } from '@libs/dao/common/user/user.entity';
import { Currency } from '@libs/dao/game/currency/currency.entity';
import { UserDetail } from '@libs/dao/game/user-detail/user-detail.entity';
import { SessionModule } from '@libs/dao/redis/session/session.module';
import { UserDetailModule } from '@libs/dao/game/user-detail/user-detail.module';
import { CurrencyModule } from '@libs/dao/game/currency/currency.module';
import { TypeOrmHelper } from '@libs/common/database/typeorm/typeorm.helper';
import { DATABASE_NAME } from '@libs/common/constants/database.constants';
import { TestUserUtils } from '../utils/test-user.utils';
import { TestTransactionUtils } from '@libs/common/utils/test/test-transaction.utils';
import { TestDataSourceUtils } from '@libs/common/utils/test/test-data-source.utils';
import { DataCurrencyRepository } from '@libs/dao/static/data-currency/data-currency.repository';
import { TestRedisDataSourceUtils } from '@libs/common/utils/test/test-redis-data-source.utils';
import { UserService } from '../../src/user/user.service';
import {
  CurrencyRepositories,
  CurrencyRepository,
} from '@libs/dao/game/currency/currency.repository';
import { ContextProvider } from '@libs/common/provider/context.provider';
import { UserModule } from '@libs/dao/common/user/user.module';
import { Reward } from '@libs/common/interface/goods.interface';
import {
  CURRENCY_TYPE,
  CurrencyType,
  GOODS_TYPE,
  ITEM_TYPE,
  ItemType,
} from '@libs/common/constants/common.contants';
import { ItemModule } from '@libs/dao/game/item/item.module';
import { DataItemRepository } from '@libs/dao/static/data-item/data-item.repository';
import {
  ItemRepositories,
  ItemRepository,
} from '@libs/dao/game/item/item.repository';
import { Item } from '@libs/dao/game/item/item.entity';
import { INTERNAL_ERROR_CODE } from '@libs/common/constants/internal-error-code.constants';
import {
  CharacterRepositories,
  CharacterRepository,
} from '@libs/dao/game/character/character.repository';
import { DataCharacterRepository } from '@libs/dao/static/data-character/data-character.repository';
import { CharacterModule } from '@libs/dao/game/character/character.module';
import { Character } from '@libs/dao/game/character/character.entity';
import {
  EquipmentRepositories,
  EquipmentRepository,
} from '@libs/dao/game/equipment/equipment.repository';
import { EquipmentModule } from '@libs/dao/game/equipment/equipment.module';
import { DataEquipmentRepository } from '@libs/dao/static/data-equipment/data-equipment.repository';
import { Equipment } from '@libs/dao/game/equipment/equipment.entity';
import { UserProvider } from '@libs/common/provider/user.provider';
import { UserDetailProvider } from '@libs/common/provider/user-detail.provider';

describe('Reward provider test', () => {
  let module: TestingModule;
  let rewardProvider: RewardProvider;
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
        CharacterModule,
        EquipmentModule,
        ItemModule,
      ],
      providers: [
        // service
        UserService,

        // provider
        RewardProvider,
        UserProvider,
        UserDetailProvider,

        // repository
        DataCurrencyRepository,
        DataCharacterRepository,
        DataEquipmentRepository,
        DataItemRepository,
      ],
    }).compile();

    rewardProvider = module.get<RewardProvider>(RewardProvider);

    userService = module.get<UserService>(UserService);

    currencyRepositories = module.get<CurrencyRepositories>(CurrencyRepository);
    characterRepositories =
      module.get<CharacterRepositories>(CharacterRepository);
    equipmentRepositories =
      module.get<EquipmentRepositories>(EquipmentRepository);
    itemRepositories = module.get<ItemRepositories>(ItemRepository);

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

  it('Reward provider defined check', async () => {
    expect(rewardProvider).toBeDefined();
  });

  /**
   * 통화 지급 테스트
   */
  it('pay 사용해서 유저한테 보상 직접 지급 - cash 일때', async () => {
    // cash 지급
    const reward = createCurrencyData(CURRENCY_TYPE.CASH, 10);

    await rewardProvider.pay([reward]);

    const { database } = ContextProvider.getSession();
    const currencyRepository = currencyRepositories[database];

    const checkCurrency = await currencyRepository.findByUserId(userId);

    expect(checkCurrency.userId).toBe(userId);
    expect(checkCurrency.cash).toBe(10);
    expect(checkCurrency.gold).toBe(0);
  });

  it('pay 사용해서 유저한테 보상 직접 지급 - gold 일때', async () => {
    // gold 지급
    const reward = createCurrencyData(CURRENCY_TYPE.GOLD, 10);

    await rewardProvider.pay([reward]);

    const { database } = ContextProvider.getSession();
    const currencyRepository = currencyRepositories[database];

    const checkCurrency = await currencyRepository.findByUserId(userId);

    expect(checkCurrency.userId).toBe(userId);
    expect(checkCurrency.gold).toBe(10);
    expect(checkCurrency.cash).toBe(0);
  });

  it('pay 사용해서 유저한테 보상 직접 지급 - gold, cash 둘다일때', async () => {
    // gold 지급
    const rewardGold = createCurrencyData(CURRENCY_TYPE.GOLD, 10);

    // cash 지급
    const rewardCash = createCurrencyData(CURRENCY_TYPE.CASH, 10);

    const reward: Reward[] = [];
    reward.push(rewardCash, rewardGold);

    await rewardProvider.pay(reward);

    const { database } = ContextProvider.getSession();
    const currencyRepository = currencyRepositories[database];

    const checkCurrency = await currencyRepository.findByUserId(userId);

    expect(checkCurrency.userId).toBe(userId);
    expect(checkCurrency.gold).toBe(rewardGold.quantity);
    expect(checkCurrency.cash).toBe(rewardCash.quantity);
  });

  /**
   * 아이템 지급 테스트
   */
  it('아이템 지급', async () => {
    const createItemInvalidData: Reward = {
      goodsType: GOODS_TYPE.ITEM,
      dataId: 0,
      quantity: 5,
    };

    try {
      await rewardProvider.pay([createItemInvalidData]);
      fail('DATA_INVALID not thrown');
    } catch (e) {
      expect(e.response).toEqual(INTERNAL_ERROR_CODE.DATA_INVALID);
    }

    const createItem = createItemData(ITEM_TYPE.MATERIAL, 5);

    await rewardProvider.pay([createItem]);

    const { database } = ContextProvider.getSession();
    const itemRepository = itemRepositories[database];

    const [checkItem] = await itemRepository.findByUserId(userId);

    expect(checkItem).toBeDefined();
    expect(checkItem.dataItemId).toBe(200000);
    expect(checkItem.count).toBe(5);

    const checkEachItem = await itemRepository.findByUserIdAndDataItemId(
      userId,
      200000,
    );

    expect(checkEachItem.dataItemId).toBe(200000);
    expect(checkEachItem.count).toEqual(5);
  });

  it('아이템 2개 이상 지급', async () => {
    const createItemData1 = createItemData(ITEM_TYPE.MATERIAL, 5);
    const createItemData2 = createItemData(ITEM_TYPE.TICKET, 6);
    const createItemData3 = createItemData(ITEM_TYPE.COIN, 7);

    await rewardProvider.pay([
      createItemData1,
      createItemData2,
      createItemData3,
    ]);

    const { database } = ContextProvider.getSession();
    const itemRepository = itemRepositories[database];

    const checkItems1 = await itemRepository.findByUserIdAndDataItemId(
      userId,
      createItemData1.dataId,
    );

    const checkItems2 = await itemRepository.findByUserIdAndDataItemId(
      userId,
      createItemData2.dataId,
    );

    const checkItems3 = await itemRepository.findByUserIdAndDataItemId(
      userId,
      createItemData3.dataId,
    );

    expect(checkItems1).toBeDefined();
    expect(checkItems2).toBeDefined();
    expect(checkItems1.count).toEqual(5);
    expect(checkItems2.count).toEqual(6);
    expect(checkItems3.count).toEqual(7);
  });

  it('아이템 수량 증가 확인', async () => {
    const { database } = ContextProvider.getSession();
    const itemRepository = itemRepositories[database];

    await itemRepository.insert(
      Item.create({
        userId: userId,
        dataItemId: 200000,
        count: 5,
      }),
    );

    const createItem1 = createItemData(ITEM_TYPE.MATERIAL, 100);
    const createItem2 = createItemData(ITEM_TYPE.MATERIAL, 45);

    await rewardProvider.pay([createItem1, createItem2]);

    const checkItem = await itemRepository.findByUserIdAndDataItemId(
      userId,
      200000,
    );

    expect(checkItem.userId).toEqual(userId);
    expect(checkItem.dataItemId).toEqual(200000);
    expect(checkItem.count).toEqual(150);
  });

  /**
   * 캐릭터 지급 테스트
   */
  it('캐릭터 지급 확인', async () => {
    // 캐릭터 보상 수량이 음수 일때 에러 확인
    // const createInvalidCharacterData = {
    //   goodsType: GOODS_TYPE.CHARACTER,
    //   dataId: 101001,
    //   quantity: -1,
    // };
    //
    // try {
    //   await rewardProvider.pay([createInvalidCharacterData]);
    //   fail('DATA_INVALID not thrown');
    // } catch (e) {
    //   expect(e.response).toEqual(INTERNAL_ERROR_CODE.DATA_INVALID);
    // }
    //
    // // 캐릭터 타입이 다를때 에러 확인 (monster 타입일 경우)
    // const createInvalidCharacterData1 = {
    //   goodsType: GOODS_TYPE.CHARACTER,
    //   dataId: 110003,
    //   quantity: 10,
    // };
    //
    // try {
    //   await rewardProvider.pay([createInvalidCharacterData1]);
    //   fail('DATA_INVALID not thrown');
    // } catch (e) {
    //   expect(e.response).toEqual(INTERNAL_ERROR_CODE.DATA_INVALID);
    // }

    // 캐릭터 데이터가 잘못된 데이터 일때
    const createInvalidCharacterData = {
      goodsType: GOODS_TYPE.CHARACTER,
      dataId: 100000,
      quantity: 5,
    };

    try {
      await rewardProvider.pay([createInvalidCharacterData]);
      fail('DATA_INVALID not thrown');
    } catch (e) {
      expect(e.response).toEqual(INTERNAL_ERROR_CODE.DATA_INVALID);
    }

    // 캐릭터 정상 지급 확인
    const createCharacterData = {
      goodsType: GOODS_TYPE.CHARACTER,
      dataId: 101001,
      quantity: 5,
    };

    await rewardProvider.pay([createCharacterData]);

    const { userId, database } = ContextProvider.getSession();
    const characterRepository = characterRepositories[database];

    const [[checkRewardCharacter], checkRewardCharacters] = await Promise.all([
      characterRepository.findByUserId(userId),
      characterRepository.findByUserId(userId),
    ]);

    expect(checkRewardCharacter).toBeDefined();
    expect(checkRewardCharacter.dataCharacterId).toBe(101001);
    expect(checkRewardCharacters.length).toBe(5);
  });

  it('캐릭터 2개 이상 지급 할때', async () => {
    const createCharacter1 = {
      goodsType: GOODS_TYPE.CHARACTER,
      dataId: 101001,
      quantity: 5,
    };

    const createCharacter2 = {
      goodsType: GOODS_TYPE.CHARACTER,
      dataId: 101011,
      quantity: 4,
    };

    const createCharacter3 = {
      goodsType: GOODS_TYPE.CHARACTER,
      dataId: 101031,
      quantity: 3,
    };

    await rewardProvider.pay([
      createCharacter1,
      createCharacter2,
      createCharacter3,
    ]);

    const { userId, database } = ContextProvider.getSession();
    const characterRepository = characterRepositories[database];

    const checkRewardCharacters =
      await characterRepository.findByUserId(userId);

    const checkRewardCharacter1 =
      await characterRepository.findByUserIdAndDataCharacterIdIn(userId, [
        createCharacter1.dataId,
      ]);

    const checkRewardCharacter2 =
      await characterRepository.findByUserIdAndDataCharacterIdIn(userId, [
        createCharacter2.dataId,
      ]);
    const checkRewardCharacter3 =
      await characterRepository.findByUserIdAndDataCharacterIdIn(userId, [
        createCharacter3.dataId,
      ]);

    expect(checkRewardCharacters.length).toEqual(12);

    expect(checkRewardCharacter1[0].dataCharacterId).toEqual(101001);
    expect(checkRewardCharacter1.length).toEqual(5);

    expect(checkRewardCharacter2[0].dataCharacterId).toEqual(101011);
    expect(checkRewardCharacter2.length).toEqual(4);

    expect(checkRewardCharacter3[0].dataCharacterId).toEqual(101031);
    expect(checkRewardCharacter3.length).toEqual(3);
  });

  /**
   * 장비 지급 테스트
   */
  it('장비 지급', async () => {
    const createEquipmentData: Reward = {
      goodsType: GOODS_TYPE.EQUIPMENT,
      dataId: 2201001,
      quantity: 5,
    };

    await rewardProvider.pay([createEquipmentData]);

    const { userId, database } = ContextProvider.getSession();

    const equipmentRepository = equipmentRepositories[database];

    const [checkEquipment] = await equipmentRepository.findByUserId(userId);
    const checkEquipments = await equipmentRepository.findByUserId(userId);

    expect(checkEquipments.length).toEqual(5);
    expect(checkEquipment.dataEquipmentId).toEqual(2201001);
  });

  it('통화, 아이템, 캐릭터, 장비 등 다양한 보상 지급', async () => {
    const createCurrency1: Reward = createCurrencyData(CURRENCY_TYPE.GOLD, 100);
    const createItem1: Reward = createItemData(ITEM_TYPE.MATERIAL, 50);
    const createCharacter: Reward = {
      goodsType: GOODS_TYPE.CHARACTER,
      dataId: 101001,
      quantity: 5,
    };
    const createEquipment1: Reward = {
      goodsType: GOODS_TYPE.EQUIPMENT,
      dataId: 2201001,
      quantity: 5,
    };
    const createItem2: Reward = createItemData(ITEM_TYPE.MATERIAL, 50);
    const createItem3: Reward = createItemData(ITEM_TYPE.TICKET, 50);
    const createCurrency2: Reward = createCurrencyData(CURRENCY_TYPE.GOLD, 100);
    const createEquipment2: Reward = {
      goodsType: GOODS_TYPE.EQUIPMENT,
      dataId: 2201002,
      quantity: 4,
    };

    await rewardProvider.pay([
      createCurrency1,
      createItem3,
      createCurrency2,
      createEquipment1,
      createItem1,
      createCharacter,
      createEquipment2,
      createItem2,
    ]);

    const { userId, database } = ContextProvider.getSession();

    const currencyRepository = currencyRepositories[database];
    const itemRepository = itemRepositories[database];
    const characterRepository = characterRepositories[database];
    const equipmentRepository = equipmentRepositories[database];

    const checkCurrencyReward = await currencyRepository.findByUserId(userId);
    const checkItemReward1 = await itemRepository.findByUserIdAndDataItemId(
      userId,
      200000,
    );
    const checkItemReward2 = await itemRepository.findByUserIdAndDataItemId(
      userId,
      200001,
    );
    const [checkCharacterReward] =
      await characterRepository.findByUserId(userId);
    const checkEquipmentReward =
      await equipmentRepository.findByUserIdAndDataEquipmentIdIn(
        userId,
        [2201001, 2201002],
      );

    const checkEachEquipmentReward1 =
      await equipmentRepository.findByUserIdAndDataEquipmentId(userId, 2201001);
    const checkEachEquipmentReward2 =
      await equipmentRepository.findByUserIdAndDataEquipmentId(userId, 2201002);

    expect(checkCurrencyReward.gold).toEqual(200);

    expect(checkItemReward1.dataItemId).toEqual(200000);
    expect(checkItemReward1.count).toEqual(100);

    expect(checkItemReward2.dataItemId).toEqual(200001);
    expect(checkItemReward2.count).toEqual(50);

    expect(checkCharacterReward.dataCharacterId).toEqual(101001);

    expect(checkEquipmentReward.length).toEqual(9);
    expect(checkEachEquipmentReward1[0].dataEquipmentId).toEqual(2201001);
    expect(checkEachEquipmentReward1.length).toEqual(5);

    expect(checkEachEquipmentReward2[0].dataEquipmentId).toEqual(2201002);
    expect(checkEachEquipmentReward2.length).toEqual(4);
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

  // 아이템 데이터 생성
  const createItemData = (itemType: ItemType, quantity: number): Reward => {
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
});
