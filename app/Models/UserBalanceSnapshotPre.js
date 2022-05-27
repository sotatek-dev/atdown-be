'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class UserBalanceSnapshotPre extends Model {
  static get table() {
    return 'user_balance_snapshot_pre';
  }
}

module.exports = UserBalanceSnapshotPre
