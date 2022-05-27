'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class PasswordResetSchema extends Schema {
  up () {
    this.create('password_resets', (table) => {
      table.increments()
      table.string('email', 255).notNullable();
      table.string('token').notNullable();
      table.tinyint('role').notNullable();
      table.bigint('time_expired').notNullable();
      table.timestamps()
    })
  }

  down () {
    this.drop('password_resets');
  }
}

module.exports = PasswordResetSchema
