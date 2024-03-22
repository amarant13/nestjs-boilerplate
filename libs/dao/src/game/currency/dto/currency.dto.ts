import { BaseDto } from '@libs/dao/base/base.dto';
import { ApiProperty } from '@nestjs/swagger';

export class CurrencyDto extends BaseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  userId: number;

  @ApiProperty()
  cash: number;

  @ApiProperty()
  gold: number;
}
