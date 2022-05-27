'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class CanceledApplyWhitelistSchema extends Schema {
  up() {
    this.create('canceled_apply_whitelist', (table) => {
      table.increments();
      table.integer('campaign_id').unsigned().index();
      table.string('wallet_address').nullable();
      table.timestamps();
    })
  }

  down() {
    this.drop('canceled_apply_whitelist')
  }
}

module.exports = CanceledApplyWhitelistSchema;
