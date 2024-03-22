import { Redis, RedisKey } from 'ioredis';
import { RedisFactory } from '@libs/common/database/redis/redis.factory';

export abstract class BaseRedisRepository {
  protected redis: Redis;
  protected readonly dbNumber: number;

  createRedisClient(): void {
    this.redis = RedisFactory.createRedisClient(this.dbNumber);
  }

  async close(): Promise<'OK'> {
    return this.redis.quit();
  }

  async flushDb(): Promise<'OK'> {
    return this.redis.flushdb();
  }

  async del(...args: [keys: string[]] | [...keys: string[]]): Promise<number> {
    const [keys] = args;

    return this.redis.del(...keys);
  }

  async ttl(key: RedisKey): Promise<number> {
    return this.redis.ttl(key);
  }
}
