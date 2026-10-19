const Redis = require('ioredis');
const env = require('./env');

// In-memory fallback map when Redis is unavailable in local dev/test
const memoryKv = new Map();
const memorySortedSets = new Map();

function createMemoryRedis() {
  return {
    isMemoryFallback: true,
    async get(key) {
      const entry = memoryKv.get(key);
      if (!entry) return null;
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        memoryKv.delete(key);
        return null;
      }
      return entry.value;
    },
    async set(key, value, mode, ttlSeconds, nx) {
      const existing = await this.get(key);
      if (nx === 'NX' && existing !== null) return null;
      const expiresAt = mode === 'EX' && ttlSeconds ? Date.now() + Number(ttlSeconds) * 1000 : null;
      memoryKv.set(key, { value: String(value), expiresAt });
      return 'OK';
    },
    async del(key) {
      return memoryKv.delete(key) ? 1 : 0;
    },
    multi() {
      const ops = [];
      return {
        zremrangebyscore(key, min, max) {
          ops.push(() => {
            const list = memorySortedSets.get(key) || [];
            memorySortedSets.set(
              key,
              list.filter((item) => item.score < min || item.score > max)
            );
            return [null, 1];
          });
          return this;
        },
        zadd(key, score, member) {
          ops.push(() => {
            const list = memorySortedSets.get(key) || [];
            list.push({ score: Number(score), member });
            memorySortedSets.set(key, list);
            return [null, 1];
          });
          return this;
        },
        zcard(key) {
          ops.push(() => {
            const list = memorySortedSets.get(key) || [];
            return [null, list.length];
          });
          return this;
        },
        pexpire() {
          ops.push(() => [null, 1]);
          return this;
        },
        async exec() {
          return ops.map((fn) => fn());
        },
      };
    },
    disconnect() {},
  };
}

let redis;
if (process.env.USE_IN_MEMORY_STORE === '1' || env.NODE_ENV === 'test' || !process.env.REDIS_URL) {
  redis = createMemoryRedis();
} else {
  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    lazyConnect: true,
    retryStrategy: (times) => (times > 2 ? null : Math.min(times * 100, 500)),
  });
  const fallback = createMemoryRedis();
  let useFallback = false;
  client.on('error', () => {
    useFallback = true;
  });
  redis = new Proxy(fallback, {
    get(target, prop) {
      if (useFallback || client.status !== 'ready') {
        return target[prop];
      }
      const val = client[prop];
      return typeof val === 'function' ? val.bind(client) : val;
    },
  });
}

module.exports = { redis, createMemoryRedis };
