'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddFieldPoolNetworkAvailableToStakingPoolSchema extends Schema {
  up() {
    this.table('staking_pools', (table) => {
      // alter table
      table.string('network_available');
    })
  }

  down() {
    this.table('staking_pools', (table) => {
      table.dropColumn('network_available');
    })
  }
}

module.exports = AddFieldPoolNetworkAvailableToStakingPoolSchema
