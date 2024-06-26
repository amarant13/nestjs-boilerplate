import { Inject, Injectable } from '@nestjs/common';
import { ContextProvider } from '@libs/common/provider/context.provider';
import { SessionRepository } from '@libs/dao/redis/session/session.repository';
import { UserRepository } from '@libs/dao/common/user/user.repository';
import {
  UserDetailRepositories,
  UserDetailRepository,
} from '@libs/dao/game/user-detail/user-detail.repository';
import { UserDetailDto } from '@libs/dao/game/user-detail/dto/user-detail.dto';
import { INTERNAL_ERROR_CODE } from '@libs/common/constants/internal-error-code.constants';
import { UserDetail } from '@libs/dao/game/user-detail/user-detail.entity';
import { TimeUtil } from '@libs/common/utils/time.util';
import { DATABASE_NAME } from '@libs/common/constants/database.constants';
import { ServerErrorException } from '@libs/common/exception/server-error.exception';
import { Transactional } from '@libs/common/decorator/transaction.decorator';
import { UserDto } from '@libs/dao/common/user/dto/user.dto';
import { UserOutDto } from '@libs/common/dto/user-out.dto';
import { UpdateUserNickNameInDto } from './dto/update-user-nick-name-in.dto';
import { SESSION_EXPIRED_TIME } from '../constants/login.constants';
import { CreateUserInDto } from './dto/create-user-in.dto';
import { UserProvider } from '@libs/common/provider/user.provider';
import { UserDetailProvider } from '@libs/common/provider/user-detail.provider';

@Injectable()
export class UserService {
  constructor(
    private readonly sessionRepository: SessionRepository,
    @Inject(UserRepository)
    private readonly userRepository: UserRepository,
    @Inject(UserDetailRepository)
    private readonly userDetailRepositories: UserDetailRepositories,
    private readonly userProvider: UserProvider,
    private readonly userDetailProvider: UserDetailProvider,
  ) {}

  /**
   * 유저 생성 확인
   */
  async isNotFoundUserDetail(): Promise<boolean> {
    const { userId, database } = ContextProvider.getSession();

    const userDetailRepository = this.userDetailRepositories[database];
    const findUserDetail = await userDetailRepository.findByUserId(userId);

    return !findUserDetail;
  }

  /**
   * 유저 정보 조회
   * TODO: 업데이트 하는게 생기면 transactional 걸어야됨
   */
  async getUser(): Promise<UserOutDto> {
    if (await this.isNotFoundUserDetail()) {
      throw new ServerErrorException(
        INTERNAL_ERROR_CODE.USER_DETAIL_NOT_FOUND,
        null,
        true,
      );
    }

    const { userId } = ContextProvider.getSession();

    const [user, userDetail] = await Promise.all([
      this.userProvider.getUser(userId),

      this.userDetailProvider.getUserDetail(),
    ]);

    return UserOutDto.of({
      user: UserDto.fromEntity(user),
      userDetail: UserDetailDto.fromEntity(userDetail),
    });
  }

  /**
   * 유저 상세 정보 생성
   */
  @Transactional(DATABASE_NAME.USER)
  async createUserDetail(
    createUserInDto: CreateUserInDto,
  ): Promise<UserDetailDto> {
    const session = ContextProvider.getSession();

    // 생성 확인
    const user = await this.userRepository.findById(session.userId);

    if (user.gameDbId !== 0) {
      throw new ServerErrorException(INTERNAL_ERROR_CODE.USER_ALREADY_CREATED);
    }

    user.gameDbId = session.gameDbId;
    user.nickName = createUserInDto.nickName;

    const userDetail = UserDetail.create({
      userId: session.userId,
      loginAt: TimeUtil.now(),
    });

    await Promise.all([
      // Create user detail
      this.userDetailRepositories[session.database].insert(userDetail),

      // Update user
      this.userRepository.updateById(user.id, user),
    ]);

    return UserDetailDto.fromEntity(userDetail);
  }

  /**
   * 닉네임 중복 확인
   */
  async existNickName(nickName: string): Promise<boolean> {
    const conflictUser = await this.userRepository.findByNickName(nickName);

    return !!conflictUser;
  }

  /**
   * 닉네임 업데이트
   */
  async updateUserNickName(
    updateUserNickNameInDto: UpdateUserNickNameInDto,
  ): Promise<UserDto> {
    const { userId } = ContextProvider.getSession();

    const user = await this.userProvider.getUser(userId);

    const { nickName } = updateUserNickNameInDto;

    if (user.nickName === nickName) {
      throw new ServerErrorException(
        INTERNAL_ERROR_CODE.USER_NICK_NAME_UPDATE_SAME,
      );
    }

    if (await this.existNickName(nickName)) {
      throw new ServerErrorException(
        INTERNAL_ERROR_CODE.USER_NICK_NAME_CONFLICT,
        null,
        true,
      );
    }

    user.nickName = nickName;

    await this.userRepository.updateById(user.id, user);

    const session = ContextProvider.getSession();

    session.nickName = nickName;

    await this.sessionRepository.setSession(
      session.userId.toString(),
      session,
      SESSION_EXPIRED_TIME,
    );

    return UserDto.fromEntity(user);
  }
}
