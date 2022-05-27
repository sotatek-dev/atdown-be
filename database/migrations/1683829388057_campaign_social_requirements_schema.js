'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class CampaignSocialRequirementsSchema extends Schema {
  up() {
    this.create('campaign_social_requirements', (table) => {
      table.increments()
      table.integer('campaign_id').unsigned().references('id').inTable('campaigns')
      table.string('self_twitter')
      table.string('self_group')
      table.string('self_channel')
      table.string('self_retweet_post')
      table.string('partner_twitter')
      table.string('partner_group')
      table.string('partner_channel')
      table.string('partner_retweet_post')
      table.timestamps()
    })
  }

  down() {
    this.drop('campaign_social_requirements')
  }
}

module.exports = CampaignSocialRequirementsSchema
