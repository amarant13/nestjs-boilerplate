import { TestEnvironConfig } from '../test-environment.config';
import { Test, TestingModule } from '@nestjs/testing';
import { UserDetailRepository } from '@libs/dao/game/user-detail/user-detail.repository';
import {
  gameTypeOrmModuleOptions,
  getDatabaseByGameDbId,
} from '@libs/common/database/typeorm/typeorm-module.options';
import { TypeOrmExModule } from '@libs/common/database/typeorm/typeorm-ex.module';
import { UserDetail } from '@libs/dao/game/user-detail/user-detail.entity';
import { UserDetailModule } from '@libs/dao/game/user-detail/user-detail.module';
import { TestTransactionUtils } from '@libs/common/utils/test/test-transaction.utils';
import { TypeOrmHelper } from '@libs/common/database/typeorm/typeorm.helper';
import { TestDataSourceUtils } from '@libs/common/utils/test/test-data-source.utils';

describe('user detail repository test', () => {
  let module: TestingModule;
  let userDetailRepository: UserDetailRepository;
  let userId: number;
  let gameDBId: number;
  let database: string;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TestEnvironConfig,
        ...Object.values(gameTypeOrmModuleOptions).map((dataSource) =>
          TypeOrmExModule.forRoot({
            ...dataSource,
            entities: [UserDetail],
          }),
        ),
        UserDetailModule,
      ],
    }).compile();

    userId = 1;
    gameDBId = 100;
    database = getDatabaseByGameDbId(gameDBId);

    userDetailRepository = module.get(UserDetailRepository)[database];
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

  it('create user detail', async () => {
    const userDetail = UserDetail.create({
      userId: userId,
    });
    expect(userDetail.id).not.toBeDefined();

    await userDetailRepository.insert(userDetail);
    expect(userDetail.id).toBeDefined();

    // exception: 중복 생성
    try {
      await userDetailRepository.insert(
        UserDetail.create({
          userId: userId,
        }),
      );
    } catch (e) {
      expect(e.code).toBe('ER_DUP_ENTRY');
    }
  });

  it('get user test', async () => {
    const userDetail = UserDetail.create({ userId: userId });

    await userDetailRepository.insert(userDetail);

    const findUserDetail = await userDetailRepository.findByUserId(userId);

    expect(findUserDetail.id).toBeGreaterThanOrEqual(1);
    expect(findUserDetail.userId).toBe(userId);
  });
});
