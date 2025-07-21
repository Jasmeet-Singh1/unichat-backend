const Redis = require('ioredis');

// Connect to Redis running locally on port 6379
const redis = new Redis(); // defaults to localhost:6379

module.exports = redis;
