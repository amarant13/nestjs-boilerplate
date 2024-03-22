import { Inject, Injectable } from '@nestjs/common';
import { UserRepository } from '@libs/dao/common/user/user.repository';
import { UserDto } from '@libs/dao/common/user/dto/user.dto';

@Injectable()
export class UserService {
  constructor(
    @Inject(UserRepository) private readonly userRepository: UserRepository,
  ) {}

  /**
   * 유저들 정보 조회
   */
  async getUsers(): Promise<UserDto[]> {
    const users = await this.userRepository.find();

    return UserDto.fromEntities(users);
  }
}
