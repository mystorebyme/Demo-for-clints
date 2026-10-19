const Redis = require('ioredis');
const env = require('./env');

const redis = new Redis(env.REDIS_URL, { maxRetriesPerRequest: 2 });
redis.on('error', (err) => console.error('[redis] error', err.message));

module.exports = { redis };
