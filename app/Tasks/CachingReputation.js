'use strict'

const Task = use('Task')
const ReputationLog = use('App/Models/ReputationLog')
const CachingReputationJob = use('App/Jobs/CachingReputationJob')

class CachingReputation extends Task {
  static get schedule() {
    return process.env.NODE_ENV == 'development' ? '*/10 * * * *' : '0 */12 * * *'
  }

  async handle() {
    // console.log('[CachingReputation] Task CachingReputation handle');
    // let addressLogs = await ReputationLog.query().select('wallet_address').groupBy('wallet_address').fetch();
    // addressLogs = JSON.parse(JSON.stringify(addressLogs))
    // const addresses = addressLogs.reduce((arrAdrs, log) => {
    //   return [...arrAdrs, log.wallet_address]
    // }, [])

    // addresses.forEach(address => {
    //   CachingReputationJob.doDispatch({ walletAddress: address });
    // })
  }
}

module.exports = CachingReputation
