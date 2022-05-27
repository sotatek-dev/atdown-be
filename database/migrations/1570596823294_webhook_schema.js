'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class WebhookSchema extends Schema {
  up () {
    this.create('webhook', (table) => {
      table.increments()

      table.string('contract_name').notNullable().index()
      table.string('type').notNullable().index()
      table.string('url').notNullable()
      table.timestamps();
    })
  }

  down () {
    this.drop('webhook')
  }
}

module.exports = WebhookSchema
