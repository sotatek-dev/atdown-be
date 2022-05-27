'use strict'

const ErrorFactory = use('App/Common/ErrorFactory');
const HelperUtils = use('App/Common/HelperUtils');
const StakingLogModel = use('App/Models/StakingLog');
const UserModel = use('App/Models/User');
const Const = use('App/Common/Const');
const BigNumber = use('bignumber.js');

class MantraStakeService {
    buildQueryBuilder(params) {
      let builder = StakingLogModel.query();
      if (params.id) {
        builder = builder.where('id', params.id);
      }
      return builder;
    }

    async findMantraStake(params) {
      let builder = this.buildQueryBuilder(params);
      return await builder.first();
    }

    async findUserStaking(walletAddress) {
      const user = await UserModel.query()
        .where('wallet_address', walletAddress)
        .where('status', Const.USER_STATUS.ACTIVE)
        .first();
      console.log('[findUserStaking] - ', JSON.stringify(user));
      return user;
    }

    async getInfoStaking(event, params, txHash) {
      const walletAddress = HelperUtils.checkSumAddress(params.user);
      const walletExist = await StakingLogModel.query().where('wallet_address', walletAddress).first();

      let stakingLog = walletExist || new StakingLogModel;
      stakingLog.wallet_address = walletAddress;
      stakingLog.current_tier = (await HelperUtils.getUserTierSmart(walletAddress))[0];

      // Get User Id exist
      const userStaking = await this.findUserStaking(walletAddress);
      stakingLog.user_id = userStaking ? userStaking.id : null;

      // Tier Staked Amount
      const tierStakedAmount = await HelperUtils.getUserTotalStakeSmartContract(walletAddress);
      // const decimals = (await HelperUtils.getExternalTokenSmartContract(walletAddress) || {}).decimals || 18;
      const decimals = 18;
      stakingLog.tier_staked_amount = new BigNumber(tierStakedAmount).dividedBy(Math.pow(10, decimals)).toFixed();

      // UnStaked Amount (Staked Mantra Dao Smart Contract)
      const unstakeAmountMantra = await HelperUtils.getUnstakeMantraSmartContract(walletAddress) || {};
      stakingLog.mantra_unstake_amount = new BigNumber(unstakeAmountMantra.amount || 0).dividedBy(Math.pow(10, 18)).toFixed();

      console.log('stakingLog:', JSON.stringify(stakingLog));
      await stakingLog.save();
      return stakingLog;
    }
}

module.exports = MantraStakeService
