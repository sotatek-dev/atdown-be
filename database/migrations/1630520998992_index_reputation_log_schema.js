'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class IndexReputationLogSchema extends Schema {
  up () {
    this.table('reputation_logs', (table) => {
      // alter table
      table.index('wallet_address')
    })
  }

  down () {
    this.table('reputation_logs', (table) => {
      // reverse alternations
      table.dropIndex('wallet_address')
    })
  }
}

module.exports = IndexReputationLogSchema
