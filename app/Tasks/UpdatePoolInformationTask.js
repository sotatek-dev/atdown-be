'use strict'

const Task = use('Task')
const PoolService = use('App/Services/PoolService');

class UpdatePoolInformationTask extends Task {
  static get schedule() {
    console.log('[UpdatePoolInformationTask] - ACTIVE - process.env.NODE_ENV', process.env.NODE_ENV);
    if (process.env.NODE_ENV == 'development') {
      // return '*/15 * * * * *';
      return '*/30 * * * * *';
      // return '0 */5000 * * * *';  // 5 minutes
      // return '0 */350 * * * *';
    } else {
      return '0 */5 * * * *';
    }
  }

  async handle() {
    console.log('[UpdatePoolInformationTask] Task UpdatePoolInformationTask handle');

    const pools = (new PoolService).runUpdatePoolStatus();

  }
}

module.exports = UpdatePoolInformationTask;
