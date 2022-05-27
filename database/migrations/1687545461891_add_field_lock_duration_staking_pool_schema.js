'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddFieldLockDurationStakingPoolSchema extends Schema {
  up() {
    this.table('staking_pools', (table) => {
      table.bigInteger('lock_duration').unsigned();
    })
  }

  down () {
    this.table('staking_pools', (table) => {
      table.dropColumn('lock_duration');
    })
  }
}

module.exports = AddFieldLockDurationStakingPoolSchema
