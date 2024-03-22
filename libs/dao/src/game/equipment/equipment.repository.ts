import { EntityRepository } from '@libs/common/database/typeorm/typeorm-ex.decorator';
import { Equipment } from '@libs/dao/game/equipment/equipment.entity';
import { BaseRepository } from '@libs/dao/base/base.repository';

export type EquipmentRepositories = Record<string, EquipmentRepository>;

@EntityRepository(Equipment)
export class EquipmentRepository extends BaseRepository<Equipment> {
  async findByIdInAndUserId(
    ids: number[],
    userId: number,
  ): Promise<Equipment[]> {
    return await this.getQueryBuilder()
      .whereInIds(ids)
      .andWhere(`${this.alias}.userId=:userId`, { userId: userId })
      .getMany();
  }

  async findByUserId(userId: number): Promise<Equipment[]> {
    return await this.getQueryBuilder()
      .where(`${this.alias}.userId=:userId`, {
        userId: userId,
      })
      .getMany();
  }

  async findByUserIdAndDataEquipmentId(
    userId: number,
    dataEquipmentId: number,
  ): Promise<Equipment[]> {
    return await this.getQueryBuilder()
      .where(`${this.alias}.userId=:userId`, {
        userId: userId,
      })
      .andWhere(`${this.alias}.dataEquipmentId=:dataEquipmentId`, {
        dataEquipmentId: dataEquipmentId,
      })
      .getMany();
  }

  async findByUserIdAndDataEquipmentIdIn(
    userId: number,
    dataEquipmentIds: number[],
  ): Promise<Equipment[]> {
    return await this.getQueryBuilder()
      .where(`${this.alias}.userId=:userId`, {
        userId: userId,
      })
      .andWhere(`${this.alias}.dataEquipmentId IN (:...dataEquipmentIds)`, {
        dataEquipmentIds: dataEquipmentIds,
      })
      .getMany();
  }
}
