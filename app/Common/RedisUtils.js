'use strict'

const Const = use('App/Common/Const');
const Redis = use('Redis');

const logRedisUtil = (message) => {
  console.log(`[RedisUtils] - ${message}`);
};

// const isDevelopment = process.env.NODE_ENV === 'development';
const ENABLE_REDIS = true;
// const ENABLE_REDIS = false;


/**
 * User Tier
 */
const getRedisKeyUserTierBalance = (walletAddress) => {
  return `user_tier_balance_${walletAddress}`;
};

/**
 * User Reputation
 */
const getRedisKeyUserReputation = (walletAddress) => {
  return `user_reputation_${walletAddress}`;
};

const getRedisUserTierBalance = async (walletAddress) => {
  return await Redis.get(getRedisKeyUserTierBalance(walletAddress));
};

const checkExistRedisUserTierBalance = async (walletAddress) => {
  let redisKey = getRedisKeyUserTierBalance(walletAddress);
  logRedisUtil(`checkExistRedisUserTierBalance - redisKey: ${redisKey}`);

  if (!ENABLE_REDIS) {
    return false;
  }

  const isExistRedisData = await Redis.exists(redisKey);

  return isExistRedisData
};

const createRedisUserTierBalance = async (walletAddress, data) => {
  const redisKey = getRedisKeyUserTierBalance(walletAddress);

  if (!ENABLE_REDIS) {
    return false;
  }

  if (!data) {
    return false;
  }

  const cache = {
    data: data,
    updatedAt: (new Date()).getTime()
  }

  logRedisUtil(`createRedisUserTierBalance - Create Cache data with key: ${redisKey}`);
  return await Redis.set(redisKey, JSON.stringify(cache));
};

const deleteRedisUserTierBalance = (walletAddress) => {
  let redisKey = getRedisKeyUserTierBalance(walletAddress);
  if (Redis.exists(redisKey)) {
    logRedisUtil(`deleteRedisUserTierBalance - existed key ${redisKey} on redis`);
    // remove old key
    Redis.del(redisKey);
    return true;
  }
  logRedisUtil(`deleteRedisUserTierBalance - not exist key ${redisKey}`);
  return false;
};

/**
 * POOL DETAIL
 */
const getRedisKeyPoolDetail = (poolId) => {
  return `public_pool_detail_${poolId}`;
};

const getRedisPoolDetail = async (poolId) => {
  return await Redis.get(getRedisKeyPoolDetail(poolId));
};

const checkExistRedisPoolDetail = async (poolId) => {
  let redisKey = getRedisKeyPoolDetail(poolId);
  logRedisUtil(`checkExistRedisPoolDetail - redisKey: ${redisKey}`);

  if (!ENABLE_REDIS) {
    return false;
  }

  const isExistRedisData = await Redis.exists(redisKey);
  if (isExistRedisData) {
    logRedisUtil(`checkExistRedisPoolDetail - Exist Redis cache with key: ${redisKey}`);
    return true;
  }
  logRedisUtil(`checkExistRedisPoolDetail - Not exist Redis cache with key: ${redisKey}`);
  return false;
};

const createRedisPoolDetail = async (poolId, data) => {
  const redisKey = getRedisKeyPoolDetail(poolId);

  if (!ENABLE_REDIS) {
    return false;
  }

  logRedisUtil(`createRedisPoolDetail - Create Cache data with key: ${redisKey}`);
  return await Redis.set(redisKey, JSON.stringify(data));
};

const deleteRedisPoolDetail = (poolId) => {
  let redisKey = getRedisKeyPoolDetail(poolId);
  if (Redis.exists(redisKey)) {
    logRedisUtil(`deleteRedisPoolDetail - existed key ${redisKey} on redis`);
    // remove old key
    Redis.del(redisKey);
    return true;
  }
  logRedisUtil(`deleteRedisPoolDetail - not exist key ${redisKey}`);
  return false;
};

/**
 * POOL LIST
 */
const getRedisKeyPoolList = ({
  page = 1, limit = 10, title = 'title',
  start_time = 'start_time', finish_time = 'finish_time',
  registed_by = 'registed_by', is_display,
}) => {
  if (is_display === undefined) is_display = 'both';
  return `public_pool_list_${page}_${limit}_${title}_${start_time}_${finish_time}_${registed_by}_${is_display}`;
};

const getRedisPoolList = async (params) => {
  return await Redis.get(getRedisKeyPoolList(params));
};

const checkExistRedisPoolList = async (params) => {
  let redisKey = getRedisKeyPoolList(params);
  logRedisUtil(`checkExistRedisPoolList - redisKey: ${redisKey}`);

  if (!ENABLE_REDIS) {
    return false;
  }

  const isExistRedisData = await Redis.exists(redisKey);
  if (isExistRedisData) {
    logRedisUtil(`checkExistRedisPoolList - Exist Redis cache with key: ${redisKey}`);
    return true;
  }
  logRedisUtil(`checkExistRedisPoolList - Not exist Redis cache with key: ${redisKey}`);
  return false;
};

const createRedisPoolList = async (params, data) => {
  const redisKey = getRedisKeyPoolList(params);
  logRedisUtil(`createRedisPoolList - Create Cache data with key: ${redisKey}`);
  return await Redis.set(redisKey, JSON.stringify(data));
};

const deleteRedisPoolList = (params) => {
  let redisKey = getRedisKeyPoolList(params);
  if (Redis.exists(redisKey)) {
    logRedisUtil(`deleteRedisPoolList - existed key ${redisKey} on redis`);
    // remove old key
    Redis.del(redisKey);
    return true;
  }
  logRedisUtil(`deleteRedisPoolList - not exist key ${redisKey}`);
  return false;
};


/**
 * TIER LIST
 */
const getRedisKeyTierList = (poolId) => {
  return `tiers_list_${poolId}`;
};

const getRedisTierList = async (poolId) => {
  return await Redis.get(getRedisKeyTierList(poolId));
};

const checkExistRedisTierList = async (poolId) => {
  let redisKey = getRedisKeyTierList(poolId);
  logRedisUtil(`checkExistRedisTierList - redisKey: ${redisKey}`);

  if (!ENABLE_REDIS) {
    return false;
  }

  const isExistRedisData = await Redis.exists(redisKey);
  if (isExistRedisData) {
    logRedisUtil(`checkExistRedisTierList - Exist Redis cache with key: ${redisKey}`);
    return true;
  }
  logRedisUtil(`checkExistRedisTierList - Not exist Redis cache with key: ${redisKey}`);
  return false;
};

const createRedisTierList = async (poolId, data) => {
  const redisKey = getRedisKeyTierList(poolId);
  logRedisUtil(`createRedisTierList - Create Cache data with key: ${redisKey}`);
  return await Redis.set(redisKey, JSON.stringify(data));
};

const deleteRedisTierList = (poolId) => {
  let redisKey = getRedisKeyTierList(poolId);
  if (Redis.exists(redisKey)) {
    logRedisUtil(`deleteRedisTierList - existed key ${redisKey} on redis`);
    // remove old key
    Redis.del(redisKey);
    return true;
  }
  logRedisUtil(`deleteRedisTierList - not exist key ${redisKey}`);
  return false;
};


/**
 * RATE SETTING
 */
const getRedisKeyRateSetting = () => {
  return `rate_setting`;
};

const getRedisRateSetting = async () => {
  return await Redis.get(getRedisKeyRateSetting());
};

const checkExistRedisRateSetting = async () => {
  let redisKey = getRedisKeyRateSetting();
  logRedisUtil(`checkExistRedisRateSetting - redisKey: ${redisKey}`);

  if (!ENABLE_REDIS) {
    return false;
  }

  const isExistRedisData = await Redis.exists(redisKey);
  if (isExistRedisData) {
    logRedisUtil(`checkExistRedisRateSetting - Exist Redis cache with key: ${redisKey}`);
    return true;
  }
  logRedisUtil(`checkExistRedisRateSetting - Not exist Redis cache with key: ${redisKey}`);
  return false;
};

const createRedisRateSetting = async (data) => {
  const redisKey = getRedisKeyRateSetting();
  logRedisUtil(`createRedisRateSetting - Create Cache data with key: ${redisKey}`);
  return await Redis.set(redisKey, JSON.stringify(data));
};

const deleteRedisRateSetting = () => {
  let redisKey = getRedisKeyRateSetting();
  if (Redis.exists(redisKey)) {
    logRedisUtil(`deleteRedisRateSetting - existed key ${redisKey} on redis`);
    // remove old key
    Redis.del(redisKey);
    return true;
  }
  logRedisUtil(`deleteRedisRateSetting - not exist key ${redisKey}`);
  return false;
};

const checkExistRedisUserReputation = async (walletAddress) => {
  let redisKey = getRedisKeyUserReputation(walletAddress);
  logRedisUtil(`checkExistRedisUserReputation - redisKey: ${redisKey}`);

  if (!ENABLE_REDIS) {
    return false;
  }

  const isExistRedisData = await Redis.exists(redisKey);

  return isExistRedisData
}

const createRedisUserReputation = async (walletAddress, data) => {
  const redisKey = getRedisKeyUserReputation(walletAddress);

  if (!ENABLE_REDIS) {
    return false;
  }

  const cache = {
    data: data,
    updatedAt: (new Date()).getTime()
  }

  logRedisUtil(`createRedisUserReputation - Create Cache data with key: ${redisKey}`);
  return await Redis.set(redisKey, JSON.stringify(cache));
};

const getRedisUserReputation = async (walletAddress) => {
  return await Redis.get(getRedisKeyUserReputation(walletAddress));
};

const delRedisUserReputation = async (walletAddress) => {
  return await Redis.del(getRedisKeyUserReputation(walletAddress));
}

module.exports = {
  // USER TIER BALANCE
  checkExistRedisUserTierBalance,
  getRedisKeyUserTierBalance,
  getRedisUserTierBalance,
  createRedisUserTierBalance,
  deleteRedisUserTierBalance,

  // POOL LIST
  checkExistRedisPoolList,
  getRedisKeyPoolList,
  getRedisPoolList,
  createRedisPoolList,
  deleteRedisPoolList,

  // POOL DETAIL
  checkExistRedisPoolDetail,
  getRedisKeyPoolDetail,
  getRedisPoolDetail,
  createRedisPoolDetail,
  deleteRedisPoolDetail,

  // TIER LIST
  checkExistRedisTierList,
  getRedisKeyTierList,
  getRedisTierList,
  createRedisTierList,
  deleteRedisTierList,

  // RATE SETTING
  checkExistRedisRateSetting,
  getRedisKeyRateSetting,
  getRedisRateSetting,
  createRedisRateSetting,
  deleteRedisRateSetting,

  //REPUTATION
  createRedisUserReputation,
  getRedisUserReputation,
  checkExistRedisUserReputation,
  delRedisUserReputation,
};
