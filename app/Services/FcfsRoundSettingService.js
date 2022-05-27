'use strict'

const ErrorFactory = use('App/Common/ErrorFactory');
const FcfsRoundSettingModel = use('App/Models/FcfsRoundSetting');
const PasswordResetModel = use('App/Models/PasswordReset');
const randomString = use('random-string');
const Const = use('App/Common/Const');
const HelperUtils = use('App/Common/HelperUtils');

class FcfsRoundService {
  buildQueryBuilder(params) {
    let builder = FcfsRoundSettingModel.query();

    if (params.idoPoolId) {
      builder = builder.where('ido_pool_id', params.idoPoolId);
    }

    if (params.phaseNumber) {
      builder = builder.where('phase_number', params.phaseNumber);
    }

    if (params.allocationBonus) {
      builder = builder.where('allocation_bonus', params.allocationBonus);
    }

    if (params.startBuyTime) {
      builder = builder.where('before_buy_end_time', params.startBuyTime);
    }

    return builder;
  }
}

module.exports = FcfsRoundService
