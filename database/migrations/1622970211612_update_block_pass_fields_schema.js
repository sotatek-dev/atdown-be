'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class UpdateBlockPassFieldsSchema extends Schema {
  up () {
    this.table('block_pass', (table) => {
      // alter table
      table.string('email');
      table.string('wallet_address');
    })
  }

  down () {
    this.table('block_pass', (table) => {
      // reverse alternations
    })
  }
}

module.exports = UpdateBlockPassFieldsSchema
