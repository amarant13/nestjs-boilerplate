import { ResourceWithOptions } from 'adminjs';
import { User } from '@libs/dao/common/user/user.entity';

export const UserResource: ResourceWithOptions = {
  resource: User,
  options: {
    navigation: { name: 'USER' },

    // 리스트모드에서 보이는 컬럼
    listProperties: ['id', 'nid', 'nickName', 'gameDbId', 'createdAt'],

    // 필터링할 컬럼
    filterProperties: ['id', 'nid', 'nickName', 'gameDbId', 'createdAt'],

    // 편집가능한 컬럼
    editProperties: ['nickName'],

    // 단일컬럼 볼때 보이는 컬럼
    showProperties: ['id', 'nickName', 'nid', 'gameDbId', 'createdAt'],

    actions: {
      delete: {
        isVisible: false,
        isAccessible: false,
      },
      bulkDelete: {
        isVisible: false,
        isAccessible: false,
      },
    },
  },
};
