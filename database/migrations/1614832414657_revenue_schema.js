'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class RevenueSchema extends Schema {
  up () {
    this.create('revenues', (table) => {
      table.increments()
      table.decimal('amount_total', 40,18)
      table.string('campaign_hash')
      table.integer('hour')
      table.integer('day')
      table.integer('month')
      table.integer('year')
      table.bigInteger('time_buy')
      table.timestamps()
    })
  }

  down () {
    this.drop('revenues')
  }
}

module.exports = RevenueSchema
