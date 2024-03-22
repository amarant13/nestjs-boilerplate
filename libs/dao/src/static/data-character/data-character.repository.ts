import { Injectable, Logger } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { readFileSync } from 'fs';
import { DataCharacter } from '@libs/dao/static/data-character/data-character.entity';

@Injectable()
export class DataCharacterRepository {
  items: Record<number, DataCharacter> = {};

  constructor() {
    this.load();
  }

  private _getJsonData(): string {
    try {
      return readFileSync('./static-data/Character.json', 'utf-8');
    } catch (e) {
      Logger.error(e.message);
    }
  }

  load(): void {
    const json = this._getJsonData();
    if (!json) return;

    const data = JSON.parse(json);

    this.items = Object.fromEntries(
      data.map((it) => [it.ID, plainToInstance(DataCharacter, it)]),
    );
  }

  values(): DataCharacter[] {
    return Object.values(this.items);
  }

  findById(id: number): DataCharacter {
    return this.items[id];
  }

  findByIdIn(ids: number[]): DataCharacter[] {
    return ids.map((id) => this.items[id]).filter((it) => !!it);
  }
}
