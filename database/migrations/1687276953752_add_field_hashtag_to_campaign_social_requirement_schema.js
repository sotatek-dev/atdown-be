'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddFieldHashtagToCampaignSocialRequirementSchema extends Schema {
  up() {
    this.table('campaign_social_requirements', (table) => {
      table.string('self_retweet_post_hashtag');
      table.string('partner_retweet_post_hashtag');
      // alter table
    })
  }

  down() {
    this.table('campaign_social_requirements', (table) => {
      table.dropColumn('self_retweet_post_hashtag');
      table.dropColumn('partner_retweet_post_hashtag');
      // reverse alternations
    })
  }
}

module.exports = AddFieldHashtagToCampaignSocialRequirementSchema
