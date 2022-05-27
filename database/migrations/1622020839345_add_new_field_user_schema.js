'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddFieldsToUserSchema extends Schema {
  up () {
    this.table('users', (table) => {
      // alter table
      table.string('record_id', 255).nullable();
      table.string('ref_id', 255).nullable();
    })
  }

  down () {
    this.table('users', (table) => {
    })
  }
}

module.exports = AddFieldsToUserSchema;
