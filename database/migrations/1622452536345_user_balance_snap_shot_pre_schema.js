'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class UserBalanceSnapshotPreSchema extends Schema {
  up() {
    this.create('user_balance_snapshot_pre', (table) => {
      table.increments();
      table.integer('campaign_id').unsigned().notNullable();
      table.string('wallet_address').notNullable();
      table.integer('lottery_ticket').unsigned().notNullable().default(0);
      table.integer('level').unsigned().nullable();
      table.decimal('pkf_balance', 20, 4).nullable();
      table.timestamps();
    })
  }

  down() {
    this.drop('user_balance_snapshot_pre')
  }
}

module.exports = UserBalanceSnapshotPreSchema;
