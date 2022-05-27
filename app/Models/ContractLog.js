/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model');

class ContractLog extends Model {
  static get table() {
    return 'contract_logs';
  }
}

module.exports = ContractLog;
