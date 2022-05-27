'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class WebhookProgressSchema extends Schema {
  up () {
    this.create('webhook_progress', (table) => {
      table.increments()

      table.integer('webhook_id').unsigned().notNullable()
      table.integer('ref_id').notNullable()
      table.boolean('is_processed').notNullable().defaultTo(false).index()
      table.integer('try_num').unsigned().notNullable().defaultTo(0)
      table.bigInteger('retry_at').unsigned().notNullable().defaultTo(0)

      table.bigInteger('created_at').unsigned().notNullable()
      table.bigInteger('updated_at').unsigned().notNullable()
    })
  }

  down () {
    this.drop('webhook_progress')
  }
}

module.exports = WebhookProgressSchema
