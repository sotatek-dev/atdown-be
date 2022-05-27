'use strict'

const Task = use('Task')
const CachingUserDataJob = use('App/Jobs/GetUserKycInformationJob')

class GetUserKycInformation extends Task {
  static get schedule() {
    return '0 * * * *'
  }

  async handle() {
    console.log('[GetUserKycInformation] Task GetUserKycInformation handle');
    CachingUserDataJob.doDispatch(null);
  }
}

module.exports = GetUserKycInformation
