'use strict'

const UserPreOrder = use('App/Models/UserPreOrder');

class UserPreOrderService {
    buildQueryBuilder(params) {
      let builder = UserPreOrder.query();
      if (params.id) {
        builder = builder.where('id', params.id);
      }
      if (params.campaign_id) {
        builder = builder.where('campaign_id', params.campaign_id);
      }
      if (params.wallet_address) {
        builder = builder.where('wallet_address', params.wallet_address);
      }
      return builder;
    }
}

module.exports = UserPreOrderService
