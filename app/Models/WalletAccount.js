/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model');

class WalletAccount extends Model {
  static get table() {
    return 'wallet_accounts';
  }
}

module.exports = WalletAccount;
