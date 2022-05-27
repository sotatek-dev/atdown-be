'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddFieldCountryToUsersSchema extends Schema {
  up() {
    this.table('users', (table) => {
      // alter table
      table.string('national_id_issuing_country', 10).nullable()
      table.string('address_country', 10).nullable()
    })
  }

  down() {
    this.table('users', (table) => {
      table.dropColumn('national_id_issuing_country');
      table.dropColumn('address_country');
    })
  }
}

module.exports = AddFieldCountryToUsersSchema
