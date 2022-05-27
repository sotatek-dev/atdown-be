'use strict'

const Task = use('Task')
const PoolService = use('App/Services/PoolService');

class UpdateClaimablePoolInformationTask extends Task {
  static get schedule() {
    console.log('[UpdateClaimablePoolInformationTask] - CLAIMABLE - process.env.NODE_ENV', process.env.NODE_ENV);
    if (process.env.NODE_ENV == 'development') {
      // return '*/5 * * * * *';  // 5 seconds
      return '*/30 * * * * *';
      // return '0 */5000 * * * *';  // 5 minutes
      // return '0 */350 * * * *';  // large
    } else {
      return '0 */5 * * * *';
    }
  }

  async handle() {
    console.log('[UpdateClaimablePoolInformationTask] Task UpdateClaimablePoolInformationTask handle');

    const pools = (new PoolService).runUpdatePoolClaimableStatus();

  }
}

module.exports = UpdateClaimablePoolInformationTask;
