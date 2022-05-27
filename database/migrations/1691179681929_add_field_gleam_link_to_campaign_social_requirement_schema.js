'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddFieldGleamLinkToCampaignSocialRequirementSchema extends Schema {
  up() {
    this.table('campaign_social_requirements', (table) => {
      table.string('gleam_link');
      // alter table
    })
  }

  down() {
    this.table('campaign_social_requirements', (table) => {
      table.dropColumn('gleam_link');
      // reverse alternations
    })
  }
}

module.exports = AddFieldGleamLinkToCampaignSocialRequirementSchema
