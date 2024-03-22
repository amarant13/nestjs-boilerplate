import { EntityRepository } from '@libs/common/database/typeorm/typeorm-ex.decorator';
import { Character } from '@libs/dao/game/character/character.entity';
import { BaseRepository } from '@libs/dao/base/base.repository';

export type CharacterRepositories = Record<string, CharacterRepository>;

@EntityRepository(Character)
export class CharacterRepository extends BaseRepository<Character> {
  async findByIdInAndUserId(
    ids: number[],
    userId: number,
  ): Promise<Character[]> {
    return await this.getQueryBuilder()
      .whereInIds(ids)
      .andWhere(`${this.alias}.userId=:userId`, { userId: userId })
      .getMany();
  }

  async findByUserId(userId: number): Promise<Character[]> {
    return await this.getQueryBuilder()
      .where(`${this.alias}.userId=:userId`, {
        userId: userId,
      })
      .getMany();
  }

  async findByUserIdAndDataCharacterId(
    userId: number,
    dataCharacterId: number,
  ): Promise<Character[]> {
    return await this.getQueryBuilder()
      .where(`${this.alias}.userId=:userId`, {
        userId: userId,
      })
      .andWhere(`${this.alias}.dataCharacterId=:dataCharacterId`, {
        dataCharacterId: dataCharacterId,
      })
      .getMany();
  }

  async findByUserIdAndDataCharacterIdIn(
    userId: number,
    dataCharacterIds: number[],
  ): Promise<Character[]> {
    return await this.getQueryBuilder()
      .where(`${this.alias}.userId=:userId`, {
        userId: userId,
      })
      .andWhere(`${this.alias}.dataCharacterId IN (:...dataCharacterIds)`, {
        dataCharacterIds: dataCharacterIds,
      })
      .getMany();
  }
}
