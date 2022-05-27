'use strict'

const CanceledApplyWhitelist = use('App/Models/CanceledApplyWhitelist');
const Const = use('App/Common/Const');

class CanceledApplyWhitelistService {
  buildQueryBuilder(params) {
    let builder = CanceledApplyWhitelist.query();
    if (params.id) {
      builder = builder.where('id', params.id);
    }
    if (params.wallet_address) {
      builder = builder.where('wallet_address', params.wallet_address);
    }
    if (params.campaign_id) {
      builder = builder.where('campaign_id', params.campaign_id);
    }
    return builder;
  }

  async findCanceledApplyWhitelist(params) {
    // TODO: Get from Redis Cache
    const record = this.buildQueryBuilder(params).first();
    return record;
  }

}

module.exports = CanceledApplyWhitelistService
