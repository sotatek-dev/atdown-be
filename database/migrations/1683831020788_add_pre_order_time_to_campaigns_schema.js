'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Const = use('App/Common/Const')

class AddPreOrderTimeToCampaignsSchema extends Schema {
  up() {
    this.table('campaigns', (table) => {
      // alter table
      table.string('start_pre_order_time').nullable();
      table.integer('pre_order_min_tier').nullable().default(Const.TIER_LEVEL.PHOENIX);
    })
  }

  down() {
    this.table('campaigns', (table) => {
    })
  }
}

module.exports = AddPreOrderTimeToCampaignsSchema;
