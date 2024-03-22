import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminUserService } from './admin-user.service';
import { ApiResponseEntity } from '@libs/common/decorator/api-response-entity.decorator';
import { AdminUserDto } from '@libs/dao/admin/admin-user/dto/admin-user.dto';
import { SignupAdminUserInDto } from './dto/signup-admin-user-in.dto';
import { ResponseEntity } from '@libs/common/network/response-entity';

@Controller('admin-user')
@ApiTags('admin-user')
export class AdminUserController {
  constructor(private readonly adminUserService: AdminUserService) {}

  @Post('signup')
  @ApiResponseEntity({ type: AdminUserDto, summary: '어드민 페이지 가입' })
  async signup(
    @Body() signupAdminUserInDto: SignupAdminUserInDto,
  ): Promise<ResponseEntity<AdminUserDto>> {
    const adminUserDto =
      await this.adminUserService.signup(signupAdminUserInDto);

    return ResponseEntity.ok().body(adminUserDto);
  }
}
