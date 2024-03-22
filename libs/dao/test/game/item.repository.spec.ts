import { Test, TestingModule } from '@nestjs/testing';
import { TestEnvironConfig } from '../test-environment.config';
import {
  gameTypeOrmModuleOptions,
  getDatabaseByGameDbId,
} from '@libs/common/database/typeorm/typeorm-module.options';
import { TypeOrmExModule } from '@libs/common/database/typeorm/typeorm-ex.module';
import { TypeOrmHelper } from '@libs/common/database/typeorm/typeorm.helper';
import { TestTransactionUtils } from '@libs/common/utils/test/test-transaction.utils';
import { TestDataSourceUtils } from '@libs/common/utils/test/test-data-source.utils';
import { StaticModule } from '@libs/dao/static/static.module';
import { ItemRepository } from '@libs/dao/game/item/item.repository';
import { DataItemRepository } from '@libs/dao/static/data-item/data-item.repository';
import { Item } from '@libs/dao/game/item/item.entity';
import { ItemModule } from '@libs/dao/game/item/item.module';

describe('item repository', () => {
  let module: TestingModule;
  let itemRepository: ItemRepository;
  let userId: number;
  let gameDBId: number;
  let database: string;
  let dataItemRepository: DataItemRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TestEnvironConfig,
        ...Object.values(gameTypeOrmModuleOptions).map((dataSource) =>
          TypeOrmExModule.forRoot({
            ...dataSource,
            entities: [Item],
          }),
        ),
        ItemModule,
        StaticModule,
      ],
    }).compile();

    userId = 1;
    gameDBId = 100;
    database = getDatabaseByGameDbId(gameDBId);

    itemRepository = module.get(ItemRepository)[database];
    dataItemRepository = module.get(DataItemRepository);
  });

  beforeEach(async () => {
    await TypeOrmHelper.Transactional([database]);
  });

  afterEach(async () => {
    await TestTransactionUtils.rollback();
  });

  afterAll(async () => {
    await TestDataSourceUtils.clearDataSource(module);
  });

  it('create item', async () => {
    const [dataItem] = dataItemRepository.values();
    const item = Item.create({
      userId: userId,
      dataItemId: dataItem.ID,
    });
    expect(item.id).not.toBeDefined();

    await itemRepository.insert(item);
    expect(item.id).toBeDefined();
  });

  it('get item', async () => {
    let items = await itemRepository.findByUserId(userId);
    expect(items.length).toBe(0);

    // create
    const [dataItem] = dataItemRepository.values();
    const item = Item.create({
      userId: userId,
      dataItemId: dataItem.ID,
    });

    await itemRepository.insert(item);
    expect(item.id).toBeDefined();

    items = await itemRepository.findByUserId(userId);
    expect(items.length).toBe(1);
    expect(items[0].userId).toBe(userId);
    expect(items[0].dataItemId).toBe(dataItem.ID);
  });
});
