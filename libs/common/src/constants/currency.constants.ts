import { CURRENCY_TYPE } from '@libs/common/constants/common.contants';

export const CURRENCY_PROPS = {
  [CURRENCY_TYPE.CASH]: 'cash',
  [CURRENCY_TYPE.GOLD]: 'gold',
} as const;
