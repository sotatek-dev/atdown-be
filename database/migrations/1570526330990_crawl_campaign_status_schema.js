'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class CrawlStatusSchema extends Schema {
  up () {
    this.create('crawl_campaign_status', (table) => {
      table.increments()
      table.string('contract_name').notNullable()
      table.string('campaign_address').nullable()
      table.integer('block_number').unsigned().notNullable()
      table.bigInteger('created_at').unsigned().notNullable()
      table.bigInteger('updated_at').unsigned().notNullable()
    })
  }

  down () {
    this.drop('crawl_campaign_status')
  }
}

module.exports = CrawlStatusSchema
