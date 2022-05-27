'use strict'

const kue = use('Kue');
const Database = use('Database');
const Const = use('App/Common/Const');
const HelperUtils = use('App/Common/HelperUtils');
const RedisUtils = use('App/Common/RedisUtils');
const UserModel = use('App/Models/User');
const CachedUserModel = use('App/Models/CachedUser');
const ReputationLogModel = use('App/Models/ReputationLog');
const BigNumber = use('bignumber.js');
const Web3 = require('web3');

const priority = 'medium'; // Priority of job, can be low, normal, medium, high or critical
const attempts = 1; // Number of times to attempt job if it fails
const remove = true; // Should jobs be automatically removed on completion
const jobFn = job => { // Function to be run on the job before it is saved
  job.backoff()
};

class CachingUserDataJob {
  // If this getter isn't provided, it will default to 1.
  // Increase this number to increase processing concurrency.
  static get concurrency() {
    return 1
  }

  // This is required. This is a unique key used to identify this job.
  static get key() {
    return Const.JOB_KEY.CACHING_USER_DATA;
  }

  // This is where the work is done.
  async handle(data) {
    try {
      console.log('[CachingUserDataJob] CachingUserDataJob-job started', data)
      if (data && data.wallet_address) {
        console.log('[CachingUserDataJob] Reload all user data')
        await this.reloadSingleUserData(data.wallet_address)
      } else {
        console.log('[CachingUserDataJob] Reload single')
        await this.reloadAllUsersData()
      }
    } catch (error) {
      throw error;
    }
  }

  async reloadAllUsersData() {
    console.log('[reloadAllUsersData] *****************************************')
    try {
      const playerIds = [];
      let userQuery = UserModel.query()
        .leftOuterJoin('whitelist_submissions', (query) => {
          query
            .on('whitelist_submissions.wallet_address', '=', 'users.wallet_address')
            .andOn('whitelist_submissions.id', '=', Database.raw('(select MAX(id) from whitelist_submissions where whitelist_submissions.wallet_address = users.wallet_address)'))
        })
        .leftOuterJoin('user_devices',(query) => {
          query.on('user_devices.user_id', '=', 'users.id')
        })
        .leftOuterJoin('cached_users',(query) => {
          query.on('cached_users.user_id', '=', 'users.id')
        })
        .select('users.*')
        .select('cached_users.tier','user_devices.player_id','user_devices.login_status','user_devices.subscribe_status')
        .select('whitelist_submissions.user_telegram', 'whitelist_submissions.user_twitter')

      let userList = JSON.parse(JSON.stringify(await userQuery.fetch()));
      const walletAddressArr = userList.map(user => user.wallet_address);
      const result = await HelperUtils.getManyUserTierSmart(walletAddressArr);
      const userTierInfo = result.data;

      if (!result.isSuccessed) {
        throw '[reloadAllUsersData] Cannot get user tier';
      }

      for (let i = 0; i < userList.length; i++) {
        const tierInfo = userTierInfo[i];
        if(Number(tierInfo[0]) !==  userList[i].tier && userList[i].subscribe_status){
          playerIds.push(userList[i].player_id);
        }
        RedisUtils.createRedisUserTierBalance(userList[i].wallet_address, tierInfo);

        console.log('[reloadAllUsersData] wallet_address', userList[i].wallet_address)
        console.log('[reloadAllUsersData] tierInfo', tierInfo)

        // const checkSumAddress = HelperUtils.checkSumAddress(userList[i].wallet_address);
        // const reputationLog = await ReputationLogModel.query().where('wallet_address', checkSumAddress).first();
      
        const record = await CachedUserModel.findBy('wallet_address', userList[i].wallet_address);
        if (record) {
          record.merge({
            user_id: userList[i].id,
            email: userList[i].email,
            is_kyc: userList[i].is_kyc,
            user_telegram: userList[i].user_telegram,
            user_twitter: userList[i].user_twitter,

            tier: Number(tierInfo[0]) || 0,
            staked_pkf: new BigNumber(tierInfo[3].rawStakedPkf).dividedBy(Math.pow(10, 18)).toFixed() || '0',
            staked_uni: new BigNumber(tierInfo[3].rawStakedUni).dividedBy(Math.pow(10, 18)).toFixed() || '0',
            staked_point: (tierInfo[1]) || '0',
            // bonus_point: (reputationLog && reputationLog.bonus) ? reputationLog.bonus : '0',
            // reputation_point: new BigNumber(tierInfo[4].rawReputation).dividedBy(Math.pow(10, 18)).toFixed() || '0',
            total_point: (tierInfo[1]) || '0',
          });

          await record.save();
          continue;
        }
        await CachedUserModel.create({
          user_id: userList[i].id,
          wallet_address: userList[i].wallet_address,
          email: userList[i].email,
          is_kyc: userList[i].is_kyc,
          user_telegram: userList[i].user_telegram,
          user_twitter: userList[i].user_twitter,

          tier: Number(tierInfo[0]) || 0,
          staked_pkf: new BigNumber(tierInfo[3].rawStakedPkf).dividedBy(Math.pow(10, 18)).toFixed() || '0',
          staked_uni: new BigNumber(tierInfo[3].rawStakedUni).dividedBy(Math.pow(10, 18)).toFixed() || '0',
          staked_point: (tierInfo[1]) || '0',
          // bonus_point: (reputationLog && reputationLog.bonus) ? reputationLog.bonus : '0',
          // reputation_point: new BigNumber(tierInfo[4].rawReputation).dividedBy(Math.pow(10, 18)).toFixed() || '0',
          total_point: (tierInfo[1]) || '0',
        })
      }
      // push notification from onesignal
      console.log("================================= playerIds : ",playerIds);
      if(playerIds.length > 0) await HelperUtils.pushOnesignalNotification("Update tier success",playerIds);
    } catch (err) {
      throw err;
    }
  }

  async reloadSingleUserData(wallet_address) {
    console.log('[reloadSingleUserData] **********************************')

    try {
      if (!Web3.utils.isAddress(wallet_address)) {
        return
      }

      let userQuery = UserModel.query()
        .leftOuterJoin('whitelist_submissions', (query) => {
          query
            .on('whitelist_submissions.wallet_address', '=', 'users.wallet_address')
            .andOn('whitelist_submissions.id', '=', Database.raw('(select MAX(id) from whitelist_submissions where whitelist_submissions.wallet_address = users.wallet_address)'))
        })
        .where('users.wallet_address', wallet_address)
        .select('users.*')
        .select('whitelist_submissions.user_telegram', 'whitelist_submissions.user_twitter')

      let userData = JSON.parse(JSON.stringify(await userQuery.first()));

      const tierInfo = await HelperUtils.getUserTierSmart(wallet_address);
      RedisUtils.createRedisUserTierBalance(wallet_address, tierInfo);

      const checkSumAddress = HelperUtils.checkSumAddress(wallet_address);
      // const reputationLog = await ReputationLogModel.query().where('wallet_address', checkSumAddress).first();

      const record = await CachedUserModel.findBy('wallet_address', wallet_address);

      if (record) {
        record.merge({
          user_id: userData.id,
          email: userData.email,
          is_kyc: userData.is_kyc,
          user_telegram: userData.user_telegram,
          user_twitter: userData.user_twitter,

          tier: Number(tierInfo[0]) || 0,
          staked_pkf: new BigNumber(tierInfo[3].rawStakedPkf).dividedBy(Math.pow(10, 18)).toFixed() || '0',
          staked_uni: new BigNumber(tierInfo[3].rawStakedUni).dividedBy(Math.pow(10, 18)).toFixed() || '0',
          staked_point: (tierInfo[1]) || '0',
          // bonus_point: (reputationLog && reputationLog.bonus) ? reputationLog.bonus : '0',
          // reputation_point: new BigNumber(tierInfo[4].rawReputation).dividedBy(Math.pow(10, 18)).toFixed() || '0',
          total_point: (tierInfo[1]) || '0',
        });

        await record.save();
        return;
      }

      await CachedUserModel.create({
        user_id: userData.id,
        wallet_address: userData.wallet_address,
        email: userData.email,
        is_kyc: userData.is_kyc,
        user_telegram: userData.user_telegram,
        user_twitter: userData.user_twitter,

        tier: Number(tierInfo[0]) || 0,
        staked_pkf: new BigNumber(tierInfo[3].rawStakedPkf).dividedBy(Math.pow(10, 18)).toFixed() || '0',
        staked_uni: new BigNumber(tierInfo[3].rawStakedUni).dividedBy(Math.pow(10, 18)).toFixed() || '0',
        staked_point: (tierInfo[1]) || '0',
        // bonus_point: (reputationLog && reputationLog.bonus) ? reputationLog.bonus : '0',
        // reputation_point: new BigNumber(tierInfo[4].rawReputation).dividedBy(Math.pow(10, 18)).toFixed() || '0',
        total_point: (tierInfo[1]) || '0',
      })
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  // Dispatch
  static doDispatch(data) {
    console.log('[CachingUserDataJob] DISPATCH CACHING USER DATA NOW', data);
    kue.dispatch(this.key, data, { priority, attempts, remove, jobFn });
  }
}

module.exports = CachingUserDataJob

