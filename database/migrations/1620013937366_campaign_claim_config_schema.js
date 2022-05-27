'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class CampaignClaimConfigSchema extends Schema {
  up () {
    this.create('campaign_claim_config', (table) => {
      table.increments();
      table.decimal('min_percent_claim', 5, 2).notNullable().default(0);
      table.decimal('max_percent_claim', 5, 2).notNullable().default(100);
      table.string('start_time').nullable();
      table.string('end_time').nullable();
      table.integer('campaign_id').unsigned().notNullable();
      table.timestamps();
    })
  }

  down () {
    this.drop('campaign_claim_config')
  }
}

module.exports = CampaignClaimConfigSchema
