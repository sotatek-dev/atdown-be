'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class StakingLogsSchema extends Schema {
  up () {
    this.create('staking_logs', (table) => {
      table.increments();

      table.string('wallet_address', 255).nullable();
      table.integer('user_id').unsigned().nullable();
      table.decimal('tier_staked_amount', 40,18).notNullable().default(0);
      table.decimal('mantra_unstake_amount', 40,18).notNullable().default(0);
      table.integer('current_tier').unsigned().notNullable().default(0);

      table.timestamps();
    })
  }

  down () {
    this.drop('staking_logs');
  }
}

module.exports = StakingLogsSchema
