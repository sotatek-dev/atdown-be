'use strict'

const kue = use('Kue');
const Const = use('App/Common/Const');
const HelperUtils = use('App/Common/HelperUtils')
const RedisUtils = use('App/Common/RedisUtils')

const priority = 'medium'; // Priority of job, can be low, normal, medium, high or critical
const attempts = 5; // Number of times to attempt job if it fails
const remove = true; // Should jobs be automatically removed on completion
const jobFn = job => { // Function to be run on the job before it is saved
  job.backoff()
};

class CachingReputationJob {
  // If this getter isn't provided, it will default to 1.
  // Increase this number to increase processing concurrency.
  static get concurrency() {
    return 1
  }

  // This is required. This is a unique key used to identify this job.
  static get key() {
    return Const.JOB_KEY.CACHING_REPUTATION;
  }

  // This is where the work is done.
  async handle(data) {
    try {
      console.log('CachingReputationJob-job started')
      await this._cachingRKPData(data.walletAddress)
    } catch (error) {
      throw error;
    }
  }
  async _cachingRKPData(walletAddress) {
    const rkpData = await HelperUtils.calcReputationPoint.getRKPData({ walletAddress, isCaching: true })
    await RedisUtils.createRedisUserReputation(walletAddress, {
      rkpFromOldStaked: rkpData.rkpFromOldStaked,
      rkpFromNewStaked: rkpData.rkpFromNewStaked,
      rkpFromKSM: rkpData.rkpFromKSM,
      rkpBonus: rkpData.rkpBonus,
      totalRKP: rkpData.totalRKP,
      stakingHistory: rkpData.stakingHistory
    });
  }

  // Dispatch
  static doDispatch(data) {
    console.log('Dispatch caching reputation NOW', data);
    kue.dispatch(this.key, data, { priority, attempts, remove, jobFn });
  }
}

module.exports = CachingReputationJob

