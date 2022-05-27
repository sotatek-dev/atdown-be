'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddDateTimeBlockTimeContractLogSchema extends Schema {
  up() {
    this.table('contract_logs', (table) => {
      table.string('user').index()
      table.bigInteger('block_time').unsigned();
      table.datetime('created_at');
      table.datetime('updated_at');
      // table.unique(['contract_name', 'event', 'transaction_hash'])
    })
  }

  down() {
    this.table('contract_logs', (table) => {
      table.dropColumn('user');
      table.dropColumn('block_time');
      table.dropColumn('created_at');
      table.dropColumn('updated_at');
      // table.dropIndex(['contract_name', 'event', 'transaction_hash'])
    })
  }
}

module.exports = AddDateTimeBlockTimeContractLogSchema
