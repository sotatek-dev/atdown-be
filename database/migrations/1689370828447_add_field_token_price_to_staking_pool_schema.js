'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddFieldTokenPriceToStakingPoolSchema extends Schema {
  up() {
    this.table('staking_pools', (table) => {
      // alter table
      table.float('accepted_token_price').defaultTo(1);
      table.float('reward_token_price').defaultTo(1);
    })
  }

  down() {
    this.table('staking_pools', (table) => {
      // reverse alternations
      table.dropColumn('accepted_token_price');
      table.dropColumn('reward_token_price');
    })
  }
}

module.exports = AddFieldTokenPriceToStakingPoolSchema
