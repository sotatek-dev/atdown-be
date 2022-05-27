'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class HistoriesSchema extends Schema {
  up () {
    this.create('histories', (table) => {
      table.increments()

      table.integer('poolId').notNullable();
      table.string('account').notNullable();
      table.integer('amount').notNullable();
      table.bigInteger('time').notNullable();

      table.timestamps()
    })
  }

  down () {
    this.drop('histories')
  }
}

module.exports = HistoriesSchema
