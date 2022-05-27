'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddFieldsToTierTableSchema extends Schema {
  up () {
    this.table('tiers', (table) => {
      // alter table
      table.decimal('ticket_allow_percent', 5,2).nullable().default(0);
      table.integer('ticket_allow').unsigned().notNullable().default(0);
    })
  }

  down () {
    this.table('tiers', (table) => {
    })
  }
}

module.exports = AddFieldsToTierTableSchema;
