'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class UserBuyCampaignSchema extends Schema {
  up () {
    this.create('user_buy_campaigns', (table) => {
      table.increments()
      table.string('user_address')
      table.tinyint('role')
      table.string('campaign_hash')
      table.string('total_usd')
      table.timestamps()
    })
  }

  down () {
    this.drop('user_buy_campaigns')
  }
}

module.exports = UserBuyCampaignSchema
