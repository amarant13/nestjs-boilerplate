import { Injectable, Logger } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { readFileSync } from 'fs';
import { DataEquipment } from '@libs/dao/static/data-equipment/data-equipment.entity';

@Injectable()
export class DataEquipmentRepository {
  items: Record<number, DataEquipment> = {};

  constructor() {
    this.load();
  }

  private _getJsonData(): string {
    try {
      return readFileSync('./static-data/Equipment.json', 'utf-8');
    } catch (e) {
      Logger.error(e.message);
    }
  }

  load(): void {
    const json = this._getJsonData();
    if (!json) return;

    const data = JSON.parse(json);

    this.items = Object.fromEntries(
      data.map((it) => [it.ID, plainToInstance(DataEquipment, it)]),
    );
  }

  values(): DataEquipment[] {
    return Object.values(this.items);
  }

  findById(id: number): DataEquipment {
    return this.items[id];
  }

  findByIdIn(ids: number[]): DataEquipment[] {
    return ids.map((id) => this.items[id]).filter((it) => !!it);
  }
}
