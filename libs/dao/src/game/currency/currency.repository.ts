import { EntityRepository } from '@libs/common/database/typeorm/typeorm-ex.decorator';
import { BaseRepository } from '@libs/dao/base/base.repository';
import { Currency } from '@libs/dao/game/currency/currency.entity';

export type CurrencyRepositories = Record<string, CurrencyRepository>;

@EntityRepository(Currency)
export class CurrencyRepository extends BaseRepository<Currency> {
  async findByUserId(userId: number): Promise<Currency> {
    return await this.getQueryBuilder()
      .where(`${this.alias}.userId=:userId`, { userId: userId })
      .getOne();
  }
}
