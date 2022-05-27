'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class CampaignTotalSchema extends Schema {
  up () {
    this.create('campaign_totals', (table) => {
      table.increments()
      table.decimal('token', 40,18)
      table.decimal('eth', 40,18)
      table.integer('campaign_id').unsigned().nullable();
      table.timestamps()
    })
  }

  down () {
    this.drop('campaign_totals')
  }
}

module.exports = CampaignTotalSchema
