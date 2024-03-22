export const GOODS_TYPE = {
  NONE: 0,
  CURRENCY: 1,
  CHARACTER: 2,
  EQUIPMENT: 3,
  ITEM: 4,
} as const;
export type GoodsType = (typeof GOODS_TYPE)[keyof typeof GOODS_TYPE];

export const CURRENCY_TYPE = {
  NONE: 0,
  CASH: 1,
  GOLD: 2,
  DIAMOND: 3,
};
export type CurrencyType = (typeof CURRENCY_TYPE)[keyof typeof CURRENCY_TYPE];

export const CHARACTER_TYPE = {
  NONE: 0,
  PLAYER_CHARACTER: 1,
  MONSTER: 2,
} as const;
export type CharacterType =
  (typeof CHARACTER_TYPE)[keyof typeof CHARACTER_TYPE];

export const EQUIPMENT_TYPE = {
  slot0: 0,
  slot1: 1,
  slot2: 2,
  slot3: 3,
} as const;
export type EquipmentType =
  (typeof EQUIPMENT_TYPE)[keyof typeof EQUIPMENT_TYPE];

export const ITEM_TYPE = {
  NONE: 0,
  MATERIAL: 1,
  TICKET: 2,
  COIN: 3,
} as const;
export type ItemType = (typeof ITEM_TYPE)[keyof typeof ITEM_TYPE];
