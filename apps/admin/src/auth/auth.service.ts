import { Inject, Injectable } from '@nestjs/common';
import { AdminUserRepository } from '@libs/dao/admin/admin-user/admin-user.repository';
import { CurrentAdmin } from 'adminjs';

@Injectable()
export class AuthService {
  constructor(
    @Inject(AdminUserRepository)
    private readonly adminUserRepository: AdminUserRepository,
  ) {}

  async login(email: string, password: string): Promise<CurrentAdmin | string> {
    const adminUser = await this.adminUserRepository.findByEmail(email);

    if (adminUser && (await adminUser.checkPassword(password))) {
      return adminUser as unknown as CurrentAdmin;
    }

    return null;
  }

  validateApiKey(apiKey: string): string {
    if (process.env.X_API_KEY === apiKey) return apiKey;
  }
}
