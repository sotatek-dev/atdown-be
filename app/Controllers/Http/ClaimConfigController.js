'use strict'

const PoolService = use('App/Services/PoolService')
const CampaignClaimConfigModel = use('App/Models/CampaignClaimConfig');
const CampaignService = use('App/Services/CampaignService');
const Const = use('App/Common/Const');

const HelperUtils = use('App/Common/HelperUtils');
const BigNumber = use('bignumber.js')
const moment = require('moment')
const {pick} = require('lodash');

const Redis = use('Redis');

class ClaimConfigController {

  async getListClaimConfig({ request, auth, params }) {
    const poolId = params.campaignId;
    console.log('[getListClaimTime] - Get Claim List with: ', poolId);
    try {
      // if (await RedisUtils.checkExistRedisPoolDetail(poolId)) {
      //   const cachedPoolDetail = await RedisUtils.getRedisPoolDetail(poolId);
      //   console.log('Exist cache data Public Pool Detail: ', cachedPoolDetail);
      //   return HelperUtils.responseSuccess(JSON.parse(cachedPoolDetail));
      // }

      let claimConfigs = await CampaignClaimConfigModel.query().where('campaign_id', poolId).fetch();
      if (!claimConfigs) {
        return HelperUtils.responseNotFound('Pool not found');
      }
      claimConfigs = JSON.parse(JSON.stringify(claimConfigs));

      // // Cache data
      // RedisUtils.createRedisPoolDetail(poolId, publicPool);

      return HelperUtils.responseSuccess(claimConfigs);
    } catch (e) {
      console.log(e);
      return HelperUtils.responseErrorInternal('ERROR: Get public pool fail !');
    }
  }


  async getClaimableAmount({ request, auth, params }) {
    const poolId = params.campaignId;
    const walletAddress = params.walletAddress;
    console.log('[getClaimableAmount] - Get Claim List with params: ', params);
    try {

      // let claimConfigs = await CampaignClaimConfigModel.query().where('campaign_id', poolId).fetch();
      // if (!claimConfigs) {
      //   return HelperUtils.responseNotFound('Pool not found');
      // }
      // claimConfigs = JSON.parse(JSON.stringify(claimConfigs));

      const campaignService = new CampaignService();
      const campaign = await campaignService.findByCampaignId(poolId);
      console.log('[getClaimableAmount] - Campaign', JSON.stringify(campaign));
      if (!campaign.campaign_hash) {
        return HelperUtils.responseErrorInternal('ERROR: Pool is not deploy. Campaign Hash is empty !');
      }
      if (campaign.is_deploy == Const.DEPLOY_STATUS.NOT_DEPLOY) {
        return HelperUtils.responseErrorInternal('ERROR: Pool is not deploy!');
      }

      const campaignClaimSC = await HelperUtils.getContractClaimInstance(campaign);
      const tokenPurchased = await campaignClaimSC.methods.userPurchased(walletAddress).call();

      return HelperUtils.responseSuccess({
        amount: tokenPurchased,
      });
    } catch (e) {
      console.log(e);
      return HelperUtils.responseErrorInternal('ERROR: Get public pool fail !');
    }
  }

}

module.exports = ClaimConfigController
