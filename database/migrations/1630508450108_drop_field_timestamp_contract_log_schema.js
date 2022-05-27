'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class DropTimestampContractLogSchema extends Schema {
  up () {
    this.table('contract_logs', (table) => {
      table.dropColumn('created_at')
      table.dropColumn('updated_at')
    })
  }

  down () {
    this.table('contract_logs', (table) => {
    })
  }
}

module.exports = DropTimestampContractLogSchema
