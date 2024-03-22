import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateUserInDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nickName: string;
}
