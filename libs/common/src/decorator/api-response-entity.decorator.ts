import { applyDecorators, HttpCode, HttpStatus, Type } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { ResponseEntity } from '@libs/common/network/response-entity';
import { PaginationDto } from '@libs/common/pagination/dto/pagination.dto';

type ApiResponseEntityOptions = {
  type?: Type;
  summary?: string;
  isArray?: boolean;
  isPagination?: boolean;
};

export const ApiResponseEntity = (options?: ApiResponseEntityOptions) => {
  const decorators = [
    HttpCode(HttpStatus.OK),
    ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden.' }),
    ApiOperation({ summary: options?.summary }),
    ApiExtraModels(ResponseEntity),
  ];

  if (!options.type) {
    decorators.push(ApiOkResponse({ type: ResponseEntity }));
  } else {
    decorators.push(ApiExtraModels(options.type));

    const properties = options.isArray
      ? {
          data: { type: 'array', items: { $ref: getSchemaPath(options.type) } },
        }
      : { data: { $ref: getSchemaPath(options.type) } };

    if (options.isPagination) {
      properties['pagination'] = { $ref: getSchemaPath(PaginationDto) };
      decorators.push(ApiExtraModels(PaginationDto));
    }

    decorators.push(
      ApiOkResponse({
        schema: {
          allOf: [{ $ref: getSchemaPath(ResponseEntity) }, { properties }],
        },
      }),
    );
  }

  return applyDecorators(...decorators);
};
