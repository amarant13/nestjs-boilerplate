import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { Session } from '@libs/dao/redis/session/session.entity';
import { BaseRedisRepository } from '@libs/dao/base/base-redis.repository';

@Injectable()
export class SessionRepository extends BaseRedisRepository {
  protected readonly dbNumber: number = 0;

  constructor() {
    super();
    this.createRedisClient();
  }

  async getSession(userId: string): Promise<Session> {
    const result = JSON.parse(await this.redis.get(userId));
    return plainToInstance(Session, result);
  }

  async setSession(userId: string, session: Session, ttl = 0): Promise<string> {
    const result = await this.redis.set(userId, JSON.stringify(session));
    if (ttl > 0) await this.redis.expire(userId, ttl);
    return result;
  }
}
