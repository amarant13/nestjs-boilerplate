import { Inject, Injectable } from '@nestjs/common';
import {
  UserDetailRepositories,
  UserDetailRepository,
} from '@libs/dao/game/user-detail/user-detail.repository';
import { UserDetail } from '@libs/dao/game/user-detail/user-detail.entity';
import { ContextProvider } from '@libs/common/provider/context.provider';
import { ServerErrorException } from '@libs/common/exception/server-error.exception';
import { INTERNAL_ERROR_CODE } from '@libs/common/constants/internal-error-code.constants';

@Injectable()
export class UserDetailProvider {
  constructor(
    @Inject(UserDetailRepository)
    private readonly userDetailRepositories: UserDetailRepositories,
  ) {}

  /**
   * 유저 디테일 조회
   */
  async getUserDetail(): Promise<UserDetail> {
    const { userId, database } = ContextProvider.getSession();

    const userDetailRepository = this.userDetailRepositories[database];

    const userDetail = await userDetailRepository.findByUserId(userId);

    if (!userDetail) {
      throw new ServerErrorException(INTERNAL_ERROR_CODE.USER_DETAIL_NOT_FOUND);
    }

    return userDetail;
  }
}
