import { FeatureType, ResourceOptions } from 'adminjs';
import { ResourceWithOptions } from 'adminjs';
import { ADMIN_ROLE_TYPE } from '@libs/dao/admin/admin-user/role.constants';
import * as bcrypt from 'bcrypt';
import passwordsFeature from '@adminjs/passwords';
import { AdminUser } from '@libs/dao/admin/admin-user/admin-user.entity';

/**
 * 권한별 액션 부여하는 옵션
 */
const options: ResourceOptions = {
  actions: {
    new: {
      isAccessible: ({ currentAdmin }): boolean => {
        return currentAdmin?.role === ADMIN_ROLE_TYPE.ADMIN;
      },
    },

    edit: {
      isAccessible: ({ currentAdmin }): boolean => {
        return currentAdmin?.role === ADMIN_ROLE_TYPE.ADMIN;
      },
    },

    delete: {
      isAccessible: ({ currentAdmin }): boolean => {
        return currentAdmin?.role === ADMIN_ROLE_TYPE.ADMIN;
      },
    },

    bulkDelete: {
      isAccessible: ({ currentAdmin }): boolean => {
        return currentAdmin?.role === ADMIN_ROLE_TYPE.ADMIN;
      },
    },
  },

  properties: { password: { isVisible: false } },

  // 리스트 모드일때 보이는 컬럼
  listProperties: ['id', 'email', 'role', 'createdAt'],

  // 단일컬럼 볼때 보이는 컬럼
  showProperties: ['id', 'email', 'role', 'createdAt'],

  sort: {
    sortBy: 'id',
    direction: 'asc',
  },

  navigation: { name: 'ADMIN_USER' },
};

const features: FeatureType[] = [
  passwordsFeature({
    properties: {
      encryptedPassword: 'password',
      password: 'newPassword',
    },
    hash: async (password) => {
      return await bcrypt.hash(password, 10);
    },
  }),
];

export const AdminUserResource: ResourceWithOptions = {
  resource: AdminUser,
  options: options,
  features: features,
};
