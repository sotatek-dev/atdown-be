'use strict'

const ErrorFactory = use('App/Common/ErrorFactory');
const HelperUtils = use('App/Common/HelperUtils');
const StakingLogModel = use('App/Models/StakingLog');
const UserModel = use('App/Models/User');
const WhitelistBannerSettingModel = use('App/Models/WhitelistBannerSetting');

const Const = use('App/Common/Const');
const BigNumber = use('bignumber.js');

class WhitelistBannerSettingService {
    buildQueryBuilder(params) {
      let builder = WhitelistBannerSetting.query();
      if (params.id) {
        builder = builder.where('id', params.id);
      }
      return builder;
    }

    async findWhitelistBannerSetting(params) {
      let builder = this.buildQueryBuilder(params);
      return await builder.first();
    }

    async getSetting(walletAddress) {
      const user = await UserModel.query()
        .where('wallet_address', walletAddress)
        .where('status', Const.USER_STATUS.ACTIVE)
        .first();
      console.log('[findUserStaking] - ', JSON.stringify(user));
      return user;
    }

    async getInfoStaking(event, params, txHash) {

    }
}

module.exports = WhitelistBannerSettingService
