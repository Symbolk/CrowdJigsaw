var redisModule = require("redis");
var Promise = require("bluebird");
Promise.promisifyAll(redisModule);
const redis = redisModule.createClient();

module.exports = redis;