'use strict'
const RateSetting = use('App/Models/RateSetting');
const HelperUtils = use('App/Common/HelperUtils');
const RedisUtils = use('App/Common/RedisUtils');

class RateSettingController {
  async getRateSetting( {request}) {
    try {
      if (await RedisUtils.checkExistRedisRateSetting()) {
        const cacheData = await RedisUtils.getRedisRateSetting();
        console.log('Exist cache data Rate Setting: ', cacheData);
        if (cacheData) {
          return HelperUtils.responseSuccess(JSON.parse(cacheData));
        }
      }

      const rateSetting = await RateSetting.query().first();

      // Cache data
      await RedisUtils.createRedisRateSetting(rateSetting);

      return HelperUtils.responseSuccess(rateSetting);
    } catch (e){
      console.error(e);
      return HelperUtils.responseErrorInternal('ERROR: Get rate setting fail !');
    }
  }

}

module.exports = RateSettingController
