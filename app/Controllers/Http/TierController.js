'use strict'

const Tier = use('App/Models/Tier');
const HelperUtils = use('App/Common/HelperUtils');
const Redis = use('Redis');
const TierService = use('App/Services/TierService')
const RedisUtils = use('App/Common/RedisUtils');

class TierController {
  async getTiers({request, params}) {
    const campaignId = params.campaignId;
    try {
      if (await RedisUtils.checkExistRedisTierList(campaignId)) {
        const cachedTiers = await RedisUtils.getRedisTierList();
        if (cachedTiers) {
          return HelperUtils.responseSuccess(JSON.parse(cachedTiers));
        }
      }

      console.log('Not exist Redis cache');
      const query = (new TierService).buildQueryBuilder({
        campaign_id: campaignId,
      }).orderBy('level', 'desc');
      const tiers = await query.fetch();

      // Cache data
      RedisUtils.createRedisTierList(campaignId, tiers);

      return HelperUtils.responseSuccess(tiers);
    } catch (e) {
      console.log(e);
      return HelperUtils.responseErrorInternal('ERROR: Get tiers fail !');
    }
  }
}

module.exports = TierController;
