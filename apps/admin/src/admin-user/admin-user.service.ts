import { Inject, Injectable } from '@nestjs/common';
import { AdminUserRepository } from '@libs/dao/admin/admin-user/admin-user.repository';
import { SignupAdminUserInDto } from './dto/signup-admin-user-in.dto';
import { AdminUserDto } from '@libs/dao/admin/admin-user/dto/admin-user.dto';
import { AdminUser } from '@libs/dao/admin/admin-user/admin-user.entity';
import * as bcrypt from 'bcrypt';
import { ServerErrorException } from '@libs/common/exception/server-error.exception';
import { INTERNAL_ERROR_CODE } from '@libs/common/constants/internal-error-code.constants';

@Injectable()
export class AdminUserService {
  constructor(
    @Inject(AdminUserRepository)
    private readonly adminUserRepository: AdminUserRepository,
  ) {}

  /**
   * 어드민 유저 가입
   */
  async signup(
    signUpAdminUserInDto: SignupAdminUserInDto,
  ): Promise<AdminUserDto> {
    await this.checkDuplicatedEmail(signUpAdminUserInDto.email);

    const adminUser = AdminUser.create({
      email: signUpAdminUserInDto.email,
      password: await bcrypt.hash(signUpAdminUserInDto.password, 10),
    });

    await this.adminUserRepository.insert(adminUser);

    return AdminUserDto.fromEntity(adminUser);
  }

  /**
   * 이메일 중복 체크
   */
  async checkDuplicatedEmail(email: string): Promise<void> {
    const checkEmail = await this.adminUserRepository.findByEmail(email);

    if (checkEmail) {
      throw new ServerErrorException(
        INTERNAL_ERROR_CODE.ADMIN_USER_CONFLICT_EMAIL,
      );
    }
  }
}
