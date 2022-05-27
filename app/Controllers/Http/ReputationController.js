'use strict'

const HelperUtils = use('App/Common/HelperUtils');
const ReputationService = use('App/Services/ReputationService');
const CachingReputationJob = use('App/Jobs/CachingReputationJob');
const CachingUserDataJob = use('App/Jobs/CachingUserDataJob');

class ReputationController {
  async indexStakeInfo({ request, params }) {
    try {
      const inputParams = request.only(['event', 'params', 'txHash']);
      console.log('[Webhook] - [Reputation] - [indexStakeInfo] - request Params: ', request.all(), params);

      const reputationLog = await (new ReputationService).indexStakeInfo(inputParams.event, inputParams.params, inputParams.txHash);

      return HelperUtils.responseSuccess(reputationLog);
    } catch (e) {
      console.log('[Webhook] - [Reputation] - [indexStakeInfo] - Error: ', e);
      return HelperUtils.responseErrorInternal('ERROR: Index stake info fail !');
    }
  }
  async getReputationPoint({ request, params }) {
    try {
      const { walletAddress } = params
      const data = await (new ReputationService).getReputationPoint(walletAddress)

      return HelperUtils.responseSuccess(data);
    } catch (error) {
      return HelperUtils.responseErrorInternal('ERROR: Get reputation point fail !');
    }
  }
  async getReputationHistory({ request, params }) {
    try {
      const { walletAddress } = params
      const page = request.input('page') ? +request.input('page') : 1;
      const pageSize = request.input('limit') ? +request.input('limit') : 10;
      const hideZeroTx = request.input('hideZeroTx') ? request.input('hideZeroTx') : false;

      const data = await (new ReputationService).getReputationHistory({ walletAddress, page, pageSize, hideZeroTx })

      return HelperUtils.responseSuccess(data)
    } catch (error) {
      return HelperUtils.responseErrorInternal('ERROR: Get reputation history fail !');
    }
  }
  async setReputationBonus({ request, params }) {
    try {
      const { walletAddress } = params
      const point = request.input('point')

      const data = await (new ReputationService).setReputationBonus({ walletAddress, point: +point || 0 })

      await (new CachingReputationJob)._cachingRKPData(walletAddress)
      await (new CachingUserDataJob).reloadSingleUserData(walletAddress)

      return HelperUtils.responseSuccess(data)
    } catch (error) {
      console.log(error)
      return HelperUtils.responseErrorInternal('ERROR: Set reputation bonus fail !');
    }
  }
}

module.exports = ReputationController;
