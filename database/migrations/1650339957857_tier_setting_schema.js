'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class TierSettingSchema extends Schema {
  up() {
    this.create('tier_settings', (table) => {
      table.increments()

      table.integer('tier').notNullable().unique().index();
      table.integer('token_amount').notNullable();

      table.timestamps()
    })
  }

  down() {
    this.drop('tier_settings')
  }
}

module.exports = TierSettingSchema
