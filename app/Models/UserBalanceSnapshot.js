'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class UserBalanceSnapshot extends Model {
  static get table() {
    return 'user_balance_snapshot';
  }
}

module.exports = UserBalanceSnapshot
