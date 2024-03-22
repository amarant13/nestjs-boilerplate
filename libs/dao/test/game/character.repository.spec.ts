import { Test, TestingModule } from '@nestjs/testing';
import { TestEnvironConfig } from '../test-environment.config';
import {
  gameTypeOrmModuleOptions,
  getDatabaseByGameDbId,
} from '@libs/common/database/typeorm/typeorm-module.options';
import { TypeOrmExModule } from '@libs/common/database/typeorm/typeorm-ex.module';
import { Character } from '@libs/dao/game/character/character.entity';
import { CharacterModule } from '@libs/dao/game/character/character.module';
import { CharacterRepository } from '@libs/dao/game/character/character.repository';
import { TypeOrmHelper } from '@libs/common/database/typeorm/typeorm.helper';
import { TestTransactionUtils } from '@libs/common/utils/test/test-transaction.utils';
import { TestDataSourceUtils } from '@libs/common/utils/test/test-data-source.utils';
import { DataCharacterRepository } from '@libs/dao/static/data-character/data-character.repository';
import { StaticModule } from '@libs/dao/static/static.module';

describe('character repository', () => {
  let module: TestingModule;
  let characterRepository: CharacterRepository;
  let userId: number;
  let gameDBId: number;
  let database: string;
  let dataCharacterRepository: DataCharacterRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TestEnvironConfig,
        ...Object.values(gameTypeOrmModuleOptions).map((dataSource) =>
          TypeOrmExModule.forRoot({
            ...dataSource,
            entities: [Character],
          }),
        ),
        CharacterModule,
        StaticModule,
      ],
    }).compile();

    userId = 1;
    gameDBId = 100;
    database = getDatabaseByGameDbId(gameDBId);

    characterRepository = module.get(CharacterRepository)[database];
    dataCharacterRepository = module.get(DataCharacterRepository);
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

  it('create character', async () => {
    const [dataCharacter] = dataCharacterRepository.values();
    const character = Character.create({
      userId: userId,
      dataCharacterId: dataCharacter.ID,
    });
    expect(character.id).not.toBeDefined();

    await characterRepository.insert(character);
    expect(character.id).toBeDefined();
  });

  it('get character', async () => {
    let characters = await characterRepository.findByUserId(userId);
    expect(characters.length).toBe(0);

    // create
    const [dataCharacter] = dataCharacterRepository.values();
    const character = Character.create({
      userId: userId,
      dataCharacterId: dataCharacter.ID,
    });

    await characterRepository.insert(character);
    expect(character.id).toBeDefined();

    characters = await characterRepository.findByUserId(userId);
    expect(characters.length).toBe(1);
    expect(characters[0].userId).toBe(userId);
    expect(characters[0].dataCharacterId).toBe(dataCharacter.ID);
  });
});
