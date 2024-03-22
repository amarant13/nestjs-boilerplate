import { BaseDto } from '@libs/dao/base/base.dto';
import { ApiProperty } from '@nestjs/swagger';

export class CharacterDto extends BaseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  userId: number;

  @ApiProperty()
  dataCharacterId: number;
}
