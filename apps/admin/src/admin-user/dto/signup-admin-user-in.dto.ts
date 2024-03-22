import { ApiProperty } from '@nestjs/swagger';

export class SignupAdminUserInDto {
  @ApiProperty()
  email: string;

  @ApiProperty()
  password: string;
}
