'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddPkfBalanceWithWeightRateToUserBalanceSnapshotsTableSchema extends Schema {
  up () {
    this.table('user_balance_snapshot', (table) => {
      // alter table
      table.decimal('pkf_balance_with_weight_rate', 40, 18).nullable().defaultTo(0);
    })
  }

  down () {
    this.table('user_balance_snapshot', (table) => {
    })
  }
}

module.exports = AddPkfBalanceWithWeightRateToUserBalanceSnapshotsTableSchema;
