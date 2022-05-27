/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model');

class transaction extends Model {
  static get table() {
    return 'transactions';
  }
}

module.exports = transaction;
