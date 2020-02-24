const redisModule = require("redis");
const Promise = require("bluebird");
Promise.promisifyAll(redisModule);
const config = require('./config/dev');

const redis = redisModule.createClient();
redis.auth(config.redis.password);
redis.select(config.redis.database);
module.exports = redis;