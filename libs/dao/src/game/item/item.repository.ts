import { BaseRepository } from '@libs/dao/base/base.repository';
import { EntityRepository } from '@libs/common/database/typeorm/typeorm-ex.decorator';
import { Item } from '@libs/dao/game/item/item.entity';

export type ItemRepositories = Record<string, ItemRepository>;

@EntityRepository(Item)
export class ItemRepository extends BaseRepository<Item> {
  async findByUserId(userId: number): Promise<Item[]> {
    return await this.getQueryBuilder()
      .where(`${this.alias}.userId=:userId`, { userId: userId })
      .getMany();
  }

  async findByUserIdAndDataItemId(
    userId: number,
    dataItemId: number,
  ): Promise<Item> {
    return await this.getQueryBuilder()
      .where(`${this.alias}.userId=:userId`, { userId: userId })
      .andWhere(`${this.alias}.dataItemId=:dataItemId`, {
        dataItemId: dataItemId,
      })
      .getOne();
  }

  async findByUserIdAndDataItemIdIn(
    userId: number,
    dataItemIds: number[],
  ): Promise<Item[]> {
    return await this.getQueryBuilder()
      .where(`${this.alias}.userId=:userId`, { userId: userId })
      .andWhere(`${this.alias}.dataItemId IN (:...dataItemIds)`, {
        dataItemIds: dataItemIds,
      })
      .getMany();
  }
}
