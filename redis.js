const redisModule = require("redis");
const Promise = require("bluebird");
Promise.promisifyAll(redisModule);
const config = require('./config/dev');

const redis = redisModule.createClient();
redis.select(config.redisDB);
module.exports = redis;