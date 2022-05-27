'use strict'

const MantraStakeService = use('App/Services/MantraStakeService');

class MantraStakeController {
  async indexStakeInfo({ request, params }) {
    try {
      const inputParams = request.only(['event', 'params', 'txHash']);
      console.log('[Webhook] - [indexStakeInfo] - request Params: ', request.all(), params);
      const stakingLog = (new MantraStakeService).getInfoStaking(inputParams.event, inputParams.params, inputParams.txHash);
      return stakingLog;
    } catch (e) {
      console.log('[Webhook] - [indexStakeInfo] - Error: ', e);
      return false;
    }
  }
}

module.exports = MantraStakeController
