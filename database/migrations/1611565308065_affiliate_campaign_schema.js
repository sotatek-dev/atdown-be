'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AffiliateCampaignSchema extends Schema {
  up () {
    this.create('affiliate_campaigns', (table) => {
      table.increments()
      table.string('campaign_creator').notNullable()
      table.string('name')
      table.string('token_address')
      table.integer('commission')
      table.integer('campaign_index')
      table.string('website_address')
      table.integer('campaign_id').unsigned().nullable();
      table.timestamps()
    })
  }

  down () {
    this.drop('affiliate_campaigns')
  }
}

module.exports = AffiliateCampaignSchema
