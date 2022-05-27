'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ContractLogSchema extends Schema {
  up () {
    this.create('contract_logs', (table) => {
      table.increments()

      table.string('contract_name').notNullable()

      table.string('event').nullable()
      table.text('return_values').notNullable()

      table.string('from').notNullable().index()
      table.string('to').notNullable().index()
      table.string('value').notNullable()

      table.integer('block_number').unsigned().notNullable().index()
      table.string('block_hash').notNullable()
      table.string('transaction_hash').notNullable().index()
      table.string('transaction_from').notNullable()
      table.string('transaction_to').notNullable()
      table.string('transaction_value').notNullable()
      table.bigInteger('gas').notNullable()
      table.bigInteger('gas_price').notNullable()
      table.bigInteger('gas_used').notNullable()

      table.bigInteger('created_at').unsigned().notNullable()
      table.bigInteger('updated_at').unsigned().notNullable()
    })
  }

  down () {
    this.drop('contract_logs')
  }
}

module.exports = ContractLogSchema
