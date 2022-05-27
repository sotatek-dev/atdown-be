'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema');
const Const = use('App/Common/Const');

class AddPublicWinnerStatusFieldToCampaignsTableSchema extends Schema {
  up () {
    this.table('campaigns', (table) => {
      // alter table
      table.boolean('public_winner_status').nullable().defaultTo(Const.PUBLIC_WINNER_STATUS.PUBLIC);
    })
  }

  down () {
    this.table('campaigns', (table) => {
    })
  }
}

module.exports = AddPublicWinnerStatusFieldToCampaignsTableSchema;
