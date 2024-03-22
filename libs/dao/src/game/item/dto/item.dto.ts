import { BaseDto } from '@libs/dao/base/base.dto';
import { ApiProperty } from '@nestjs/swagger';

export class ItemDto extends BaseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  userId: number;

  @ApiProperty()
  dataItemId: number;

  @ApiProperty()
  count: number;
}
