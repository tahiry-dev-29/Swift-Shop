import Redis from 'ioredis';

export type RedisClient = Redis | null;

export function createRedisIfEnabled(url: string | undefined): RedisClient {
  if (!url) return null;
  const client = new Redis(url, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    retryStrategy: () => null,
  });
  client.connect().catch(() => undefined);
  client.on('error', () => undefined);
  return client;
}
