'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AssetTokenSchema extends Schema {
  up () {
    this.create('asset_tokens', (table) => {
      table.increments()
      table.string('token_address')
      table.string('symbol_name')
      table.string('decimals_of_precision')
      table.string('wallet_address')

      table.timestamps()
    })
  }

  down () {
    this.drop('asset_tokens')
  }
}

module.exports = AssetTokenSchema
