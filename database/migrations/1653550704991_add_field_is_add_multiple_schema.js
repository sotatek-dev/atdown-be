'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddFieldIsAddMultipleSchema extends Schema {
  up () {
    this.table('histories', (table) => {
      // alter table
      table.integer('is_add_multiple').nullable();
      table.string('type').nullable();
    })
  }

  down () {
    this.table('add_field_is_add_multiples', (table) => {
      // reverse alternations
      table.dropColumn('is_add_multiple');
      table.dropColumn('type');
    })
  }
}

module.exports = AddFieldIsAddMultipleSchema
