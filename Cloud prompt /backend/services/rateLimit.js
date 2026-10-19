const { redis } = require('../config/redis');

// Redis sorted-set sliding window. Returns { allowed, remaining }.
async function slidingWindow(key, limit, windowMs) {
  const now = Date.now();
  const member = `${now}-${Math.random().toString(36).slice(2)}`;
  const res = await redis
    .multi()
    .zremrangebyscore(key, 0, now - windowMs)
    .zadd(key, now, member)
    .zcard(key)
    .pexpire(key, windowMs)
    .exec();
  const count = res[2][1];
  return { allowed: count <= limit, remaining: Math.max(limit - count, 0) };
}

// Fastify preHandler factory: rateLimit({ name, limit, windowMs })
function rateLimit({ name, limit, windowMs }) {
  return async function (req, reply) {
    try {
      const { allowed } = await slidingWindow(`rl:${name}:${req.ip}`, limit, windowMs);
      if (!allowed) {
        return reply.code(429).send({ success: false, error: 'Too many requests, please slow down.' });
      }
    } catch (err) {
      // If Redis is down, fail open for browsing but log loudly.
      req.log.error({ err: err.message }, 'rate limiter unavailable');
    }
  };
}

module.exports = { slidingWindow, rateLimit };
