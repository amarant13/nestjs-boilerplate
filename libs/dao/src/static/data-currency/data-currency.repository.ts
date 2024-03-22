import { Injectable, Logger } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { readFileSync } from 'fs';
import { DataCurrency } from '@libs/dao/static/data-currency/data-currency.entity';

@Injectable()
export class DataCurrencyRepository {
  items: Record<number, DataCurrency> = {};

  constructor() {
    this.load();
  }

  private _getJsonData(): string {
    try {
      return readFileSync('./static-data/Currency.json', 'utf-8');
    } catch (e) {
      Logger.error(e.message);
    }
  }

  load(): void {
    const json = this._getJsonData();
    if (!json) return;

    const data = JSON.parse(json);

    this.items = Object.fromEntries(
      data.map((it) => [it.ID, plainToInstance(DataCurrency, it)]),
    );
  }

  values(): DataCurrency[] {
    return Object.values(this.items);
  }

  findById(id: number): DataCurrency {
    return this.items[id];
  }

  findByIdIn(ids: number[]): DataCurrency[] {
    return ids.map((id) => this.items[id]).filter((it) => !!it);
  }
}
