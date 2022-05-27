'use strict'

/*
|--------------------------------------------------------------------------
| UserSeeder
|--------------------------------------------------------------------------
|
| Make use of the Factory instance to seed database with dummy data or
| make use of Lucid models directly.
|
*/

/** @type {import('@adonisjs/lucid/src/Factory')} */
const HelperUtils = use('App/Common/HelperUtils');
const ContractLog = use('App/Models/ContractLog');
const ReputationService = use('App/Services/ReputationService');

class UpdateContractLog {
    async run() {
        const eventNames = ['StakedERC20', 'WithdrawnERC20', 'AllocDeposit', 'AllocWithdraw', 'LinearDeposit', 'LinearWithdraw']
        await this.updateContractLogs(eventNames)

        // await this.updateReputationLogs(eventNames)
    }
    async updateContractLogs(eventNames) {
        let contractStakingLogs = await ContractLog.query().whereIn('event', eventNames).fetch();
        contractStakingLogs = JSON.parse(JSON.stringify(contractStakingLogs));

        await Promise.all(contractStakingLogs.map(log => this.updateContractLog(log)))
    }
    async updateContractLog(contractLog) {
        const blockInfo = await HelperUtils.getBlockInfo(contractLog.block_number)
        const returnValues = JSON.parse(contractLog.return_values)
        await ContractLog.query().where('id', contractLog.id).update({ user: returnValues.account || returnValues.user, block_time: blockInfo.timestamp, created_at: new Date(), updated_at: new Date() })
    }
    // async updateReputationLogs(eventNames) {
    //     let stakingData = await ContractLog.query().whereIn('event', eventNames).orderBy('block_time', 'ASC').fetch()
    //     stakingData = JSON.parse(JSON.stringify(stakingData)).map(data => {
    //         return {
    //             ...data,
    //             returnValues: JSON.parse(data.return_values)
    //         }
    //     });

    //     const addresses = [...new Set(stakingData.map(log => log.returnValues.account || log.returnValues.user))]

    //     await Promise.all(addresses.map(address => {
    //         return (new ReputationService).insertDataReputationLog({
    //             address,
    //             stakingData: stakingData.filter(data => data.user == address)
    //         })
    //     }))
    // }
}

module.exports = UpdateContractLog;