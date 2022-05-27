'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class UserBalanceSnapshotSchema extends Schema {
  up() {
    this.create('user_balance_snapshot', (table) => {
      table.increments();
      table.integer('campaign_id').unsigned().notNullable();
      table.string('wallet_address').notNullable();
      table.integer('lottery_ticket').unsigned().notNullable().default(0);
      table.integer('winner_ticket').unsigned().nullable().default(0);
      table.integer('level').unsigned().nullable();
      table.decimal('pkf_balance', 20, 4).nullable();
      table.decimal('uni_lp_balance', 20, 4).nullable();
      table.decimal('nft_balance', 20, 4).nullable();
      table.decimal('mantra_lp_balance', 20, 4).nullable();
      table.timestamps();
    })
  }

  down() {
    this.drop('user_balance_snapshot')
  }
}

module.exports = UserBalanceSnapshotSchema;
