import { Controller, Get } from '@nestjs/common';
import { AdminService } from './admin.service';
import { ApiResponseEntity } from '@libs/common/decorator/api-response-entity.decorator';
import { ResponseEntity } from '@libs/common/network/response-entity';

@Controller()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('/health')
  @ApiResponseEntity({ summary: '헬스 체크' })
  health(): ResponseEntity<Record<string, string>> {
    return ResponseEntity.ok().body(this.adminService.health());
  }
}
