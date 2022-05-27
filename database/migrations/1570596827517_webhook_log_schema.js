'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class WebhookLogSchema extends Schema {
  up () {
    this.create('webhook_log', (table) => {
      table.increments()

      table.integer('webhook_progress_id').unsigned().notNullable()
      table.string('url').notNullable()
      table.text('params').notNullable()
      table.integer('status').unsigned().notNullable()
      table.text('msg').notNullable()

      table.bigInteger('created_at').unsigned().notNullable()
    })
  }

  down () {
    this.drop('webhook_log')
  }
}

module.exports = WebhookLogSchema
