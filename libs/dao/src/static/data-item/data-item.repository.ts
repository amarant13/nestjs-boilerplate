import { Injectable, Logger } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { readFileSync } from 'fs';
import { DataItem } from '@libs/dao/static/data-item/data-item.entity';

@Injectable()
export class DataItemRepository {
  items: Record<number, DataItem> = {};

  constructor() {
    this.load();
  }

  private _getJsonData(): string {
    try {
      return readFileSync('./static-data/Item.json', 'utf-8');
    } catch (e) {
      Logger.error(e.message);
    }
  }

  load(): void {
    const json = this._getJsonData();
    if (!json) return;

    const data = JSON.parse(json);

    this.items = Object.fromEntries(
      data.map((it) => [it.ID, plainToInstance(DataItem, it)]),
    );
  }

  values(): DataItem[] {
    return Object.values(this.items);
  }

  findById(id: number): DataItem {
    return this.items[id];
  }

  findByIdIn(ids: number[]): DataItem[] {
    return ids.map((id) => this.items[id]).filter((it) => !!it);
  }
}
