'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddPrivateKeyToWalletAccount extends Schema {
  up () {
    this.table('wallet_accounts', (table) => {
      // alter table
      table.string('private_key').nullable();
    })
  }

  down () {
    this.table('wallet_accounts', (table) => {
    })
  }
}

module.exports = AddPrivateKeyToWalletAccount;
