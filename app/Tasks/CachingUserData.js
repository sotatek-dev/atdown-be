'use strict'

const Task = use('Task')
const ReputationLog = use('App/Models/ReputationLog')
const CachingUserDataJob = use('App/Jobs/CachingUserDataJob')

class CachingUserData extends Task {
  static get schedule() {
    return '* */5 * * * *'
  }

  async handle() {
    console.log('[CachingUserDataJob] Task CachingUserData handle');
    CachingUserDataJob.doDispatch(null);
  }
}

module.exports = CachingUserData
