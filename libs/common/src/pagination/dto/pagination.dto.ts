import { ApiProperty } from '@nestjs/swagger';
import { PaginationOptions } from '@libs/common/pagination/pagination-options';

export interface PaginationParameters {
  paginationOptions: PaginationOptions;
}

export class PaginationDto {
  @ApiProperty()
  readonly nextCursor: string;

  constructor({ paginationOptions }: PaginationParameters) {
    this.nextCursor = paginationOptions.nextCursor;
  }
}

export class NextCursorData {
  id: number;
  key: number;
}
