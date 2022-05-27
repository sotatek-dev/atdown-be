'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddFieldIsLuckyToUserBalanceSnapshotsSchema extends Schema {
  up() {
    this.table('user_balance_snapshot', (table) => {
      // alter table
      table.integer('lucky_level').unsigned().nullable();
    })
  }

  down() {
    this.table('user_balance_snapshot', (table) => {
      table.dropColumn('lucky_level');
    })
  }
}

module.exports = AddFieldIsLuckyToUserBalanceSnapshotsSchema
