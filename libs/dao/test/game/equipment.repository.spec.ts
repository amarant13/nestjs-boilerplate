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
import { DataEquipmentRepository } from '@libs/dao/static/data-equipment/data-equipment.repository';
import { EquipmentRepository } from '@libs/dao/game/equipment/equipment.repository';
import { Equipment } from '@libs/dao/game/equipment/equipment.entity';
import { EquipmentModule } from '@libs/dao/game/equipment/equipment.module';

describe('equipment repository', () => {
  let module: TestingModule;
  let equipmentRepository: EquipmentRepository;
  let userId: number;
  let gameDBId: number;
  let database: string;
  let dataEquipmentRepository: DataEquipmentRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TestEnvironConfig,
        ...Object.values(gameTypeOrmModuleOptions).map((dataSource) =>
          TypeOrmExModule.forRoot({
            ...dataSource,
            entities: [Equipment],
          }),
        ),
        EquipmentModule,
        StaticModule,
      ],
    }).compile();

    userId = 1;
    gameDBId = 100;
    database = getDatabaseByGameDbId(gameDBId);

    equipmentRepository = module.get(EquipmentRepository)[database];
    dataEquipmentRepository = module.get(DataEquipmentRepository);
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

  it('equipment character', async () => {
    const [dataEquipment] = dataEquipmentRepository.values();
    const equipment = Equipment.create({
      userId: userId,
      dataEquipmentId: dataEquipment.ID,
    });
    expect(equipment.id).not.toBeDefined();

    await equipmentRepository.insert(equipment);
    expect(equipment.id).toBeDefined();
  });

  it('get character', async () => {
    let equipments = await equipmentRepository.findByUserId(userId);
    expect(equipments.length).toBe(0);

    // create
    const [dataCharacter] = dataEquipmentRepository.values();
    const character = Equipment.create({
      userId: userId,
      dataEquipmentId: dataCharacter.ID,
    });

    await equipmentRepository.insert(character);
    expect(character.id).toBeDefined();

    equipments = await equipmentRepository.findByUserId(userId);
    expect(equipments.length).toBe(1);
    expect(equipments[0].userId).toBe(userId);
    expect(equipments[0].dataEquipmentId).toBe(dataCharacter.ID);
  });
});
