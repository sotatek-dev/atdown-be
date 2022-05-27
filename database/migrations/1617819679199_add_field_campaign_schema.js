'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddFieldCampaignSchema extends Schema {
  up () {
    this.table('campaigns', (table) => {
      // // alter table
      // table.string('banner').nullable();
      // table.string('address_receiver').nullable();
      // table.string('token_images').nullable();
      // table.string('total_sold_coin').nullable();
      //
      // table.string('release_time').nullable();
      // table.string('start_join_pool_time').nullable();
      // table.string('end_join_pool_time').nullable();
      //
      // table.string('accept_currency').nullable();
      // table.string('network_available').nullable();
      // table.string('buy_type').nullable();
      // table.string('pool_type').nullable();
      // table.integer('min_tier').nullable().defaultTo(1);
      // table.boolean('is_deploy').notNullable().defaultTo(0);
      // table.boolean('is_display').notNullable().defaultTo(0); // Display in dashboard

    })
  }

  down () {
    this.table('campaigns', (table) => {
    })
  }
}

module.exports = AddFieldCampaignSchema
