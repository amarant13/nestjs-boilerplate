import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { ApiResponseEntity } from '@libs/common/decorator/api-response-entity.decorator';
import { UserDto } from '@libs/dao/common/user/dto/user.dto';
import { ResponseEntity } from '@libs/common/network/response-entity';
import { ApiKeyAuthGuard } from '../auth/guard/api-key-auth-guard';

@Controller('users')
@ApiTags('user')
@UseGuards(ApiKeyAuthGuard)
@ApiSecurity('apiKey')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiResponseEntity({
    type: UserDto,
    isArray: true,
    summary: '유저 정보 조회',
  })
  async getUsers(): Promise<ResponseEntity<UserDto[]>> {
    const usersDto = await this.userService.getUsers();

    return ResponseEntity.ok().body(usersDto);
  }
}
