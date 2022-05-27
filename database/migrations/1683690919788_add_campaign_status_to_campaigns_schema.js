'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Const = use('App/Common/Const');

class AddCampaignStatusToCampaignsSchema extends Schema {
  up() {
    this.table('campaigns', (table) => {
      // alter table
      table.string('token_sold').nullable().default(0);
      table.string('campaign_status').nullable().default(Const.POOL_STATUS.TBA);
      // table.string('progress').nullable().default(0);
      // table.boolean('is_end').nullable().default(false);
    })
  }

  down() {
    this.table('campaigns', (table) => {
    })
  }
}

module.exports = AddCampaignStatusToCampaignsSchema;
