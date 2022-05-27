/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model');

class StakingLog extends Model {
  static get table() {
    return 'staking_logs';
  }
}

module.exports = StakingLog;
