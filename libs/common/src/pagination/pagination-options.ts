import { IsString } from 'class-validator';

export class PaginationOptions {
  @IsString()
  readonly nextCursor?: string = '' as any;
}
