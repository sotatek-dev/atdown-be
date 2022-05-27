'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class TransactionSchema extends Schema {
  up () {
    this.create('transactions', (table) => {
      table.increments()
      table.integer('campaign_id').unsigned().nullable();
      table.string('purchaser')
      table.string('beneficiary')
      table.decimal('amount_received', 40,18)
      table.string('token')
      table.decimal('value_paid', 40,18)
      table.string('name');
      table.string('symbol');
      table.string('transaction_hash');
      table.string('type').defaultTo(false)
      table.timestamps()
    })
  }

  down () {
    this.drop('transactions')
  }
}

module.exports = TransactionSchema
