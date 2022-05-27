'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class WalletAccountsSchema extends Schema {
  up () {
    this.create('wallet_accounts', (table) => {
      table.increments();

      table.string('wallet_address').nullable();
      table.integer('campaign_id').unsigned().nullable();

      table.timestamps();
    })
  }

  down () {
    this.drop('wallet_accounts')
  }
}

module.exports = WalletAccountsSchema
