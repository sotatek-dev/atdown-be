'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddFieldPoolAddressToStakingPoolSchema extends Schema {
  up() {
    this.table('staking_pools', (table) => {
      // alter table
      table.string('pool_address');
    })
  }

  down() {
    this.table('staking_pools', (table) => {
      table.dropColumn('pool_address');
    })
  }
}

module.exports = AddFieldPoolAddressToStakingPoolSchema
