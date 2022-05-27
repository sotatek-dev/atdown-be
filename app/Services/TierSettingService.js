'use strict'

const ErrorFactory = use('App/Common/ErrorFactory');
const TierSettingModel = use('App/Models/TierSetting');

class TierSettingService {
  buildQueryBuilder(params) {
    let builder = TierSettingModel.query();

    if (params.id) {
      builder = builder.where('id', params.id);
    }
    if (params.tier) {
      builder = builder.where('tier', params.tier);
    }
    if (params.token_amount) {
      builder = builder.where('token_amount', params.token_amount);
    }

    return builder;
  }

  async getTierSettings(params) {
    let tierSettingQuery = TierSettingModel.query().fetch();
    return tierSettingQuery;
  }

  async updateTierSetting(params, tier) {
    let query = this.buildQueryBuilder({ tier });
    const result = await query.update(params);
    return result;
  }
}

module.exports = TierSettingService
