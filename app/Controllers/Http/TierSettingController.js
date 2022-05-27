'use strict'
const RateSetting = use('App/Models/RateSetting');
const HelperUtils = use('App/Common/HelperUtils');
const RedisUtils = use('App/Common/RedisUtils');
const TierSettingModel = use('App/Models/TierSetting');
const TierSettingService = use('App/Services/TierSettingService')

class TierSettingController {
  async getTierSetting({ request }) {
    try {
      const tierSettingService = new TierSettingService();
      const tierSettings = await tierSettingService.getTierSettings({});

      return HelperUtils.responseSuccess(tierSettings);
    } catch (e) {
      console.error(e);
      return HelperUtils.responseErrorInternal('ERROR: Get tiers setting fail !');
    }
  }

  async updateTierSetting({ request, auth, params }) {
    try {
      const updateInfo = request.only(['token_amount']);
      const editTier = params.tier;
      const tierSettingService = new TierSettingService();

      await tierSettingService.updateTierSetting(updateInfo, editTier);
      return HelperUtils.responseSuccess();
    } catch (e) {
      console.log(e);
      return HelperUtils.responseErrorInternal('ERROR: Update tiers setting fail !');
    }
  }
}

module.exports = TierSettingController
