'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Const = use('App/Common/Const');

class AddWhiteListCountryToCampaignsTableSchema extends Schema {
  up () {
    this.table('campaigns', (table) => {
      // alter table
      table.string('token_sold_display').nullable();
      table.string('progress_display').nullable();
    })
  }

  down () {
    this.table('campaigns', (table) => {
    })
  }
}

module.exports = AddWhiteListCountryToCampaignsTableSchema;
