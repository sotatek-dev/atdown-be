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
const ContractLog = use('App/Models/ContractLog');
const ReputationService = use('App/Services/ReputationService');

class UpdateReputationLog {
    async run() {
        const eventNames = ['StakedERC20', 'WithdrawnERC20', 'AllocDeposit', 'AllocWithdraw', 'LinearDeposit', 'LinearWithdraw']

        let stakingData = await ContractLog.query().whereIn('event', eventNames).orderBy('block_time', 'ASC').fetch()
        stakingData = JSON.parse(JSON.stringify(stakingData)).map(data => {
            return {
                ...data,
                returnValues: JSON.parse(data.return_values)
            }
        });

        const addresses = [...new Set(stakingData.map(log => log.returnValues.account || log.returnValues.user))]

        await Promise.all(addresses.map(address => {
            return (new ReputationService).insertDataReputationLog({
                address,
                stakingData: stakingData.filter(data => data.user == address)
            })
        }))
    }
}

module.exports = UpdateReputationLog;