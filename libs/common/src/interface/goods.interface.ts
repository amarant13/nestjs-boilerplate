import { GoodsType } from '@libs/common/constants/common.contants';

export interface Reward {
  goodsType: GoodsType; // common.constants 에 typeof 로 한 것과 연관있음
  dataId: number;
  quantity: number;
}

export interface Material {
  goodsType: GoodsType;
  id?: number;
  dataId?: number;
  quantity?: number;
}
