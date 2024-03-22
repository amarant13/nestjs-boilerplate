import { ApiTags } from '@nestjs/swagger';
import { Body, Controller, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiResponseEntity } from '@libs/common/decorator/api-response-entity.decorator';
import { UserDetailDto } from '@libs/dao/game/user-detail/dto/user-detail.dto';
import { ResponseEntity } from '@libs/common/network/response-entity';
import { INTERNAL_ERROR_CODE } from '@libs/common/constants/internal-error-code.constants';
import { Auth } from '../decorator/auth.decorator';
import { UserOutDto } from '@libs/common/dto/user-out.dto';
import { UserLevelLock } from '@libs/common/decorator/user-level-lock.decorator';
import { UserDto } from '@libs/dao/common/user/dto/user.dto';
import { UpdateUserNickNameInDto } from './dto/update-user-nick-name-in.dto';
import { CreateUserInDto } from './dto/create-user-in.dto';

@Controller('user')
@ApiTags('user')
@Auth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('get')
  @ApiResponseEntity({ type: UserOutDto, summary: '유저 정보 조회' })
  async getUser(): Promise<ResponseEntity<UserOutDto>> {
    const userOutDto = await this.userService.getUser();

    return ResponseEntity.ok().body(userOutDto);
  }

  @Post('create')
  @ApiResponseEntity({ type: UserDetailDto, summary: '유저(상세정보) 생성' })
  @UserLevelLock()
  async createUser(
    @Body() createUserInDto: CreateUserInDto,
  ): Promise<ResponseEntity<UserDetailDto>> {
    const { nickName } = createUserInDto;

    if (await this.userService.existNickName(nickName)) {
      return ResponseEntity.error(
        INTERNAL_ERROR_CODE.USER_NICK_NAME_CONFLICT,
        'USER_NICK_NAME_CONFLICT',
      );
    }

    const userDetailDto =
      await this.userService.createUserDetail(createUserInDto);

    return ResponseEntity.ok().body(userDetailDto);
  }

  @Post('nick-name/update')
  @ApiResponseEntity({ type: UserDto, summary: '유저 닉네임 수정' })
  @UserLevelLock()
  async updateUserNickName(
    @Body() updateUserNickNameInDto: UpdateUserNickNameInDto,
  ): Promise<ResponseEntity<UserDto>> {
    const UserDto = await this.userService.updateUserNickName(
      updateUserNickNameInDto,
    );

    return ResponseEntity.ok().body(UserDto);
  }
}
