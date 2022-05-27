'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddUsdtDisplayFieldsToCampaignsTableSchema extends Schema {
  up () {
    this.table('campaigns', (table) => {
      // alter table
      table.decimal('price_usdt', 40, 18).nullable().defaultTo(0);
      table.boolean('display_price_rate').nullable().defaultTo(1);
    })
  }

  down () {
    this.table('campaigns', (table) => {
    })
  }
}

module.exports = AddUsdtDisplayFieldsToCampaignsTableSchema;
