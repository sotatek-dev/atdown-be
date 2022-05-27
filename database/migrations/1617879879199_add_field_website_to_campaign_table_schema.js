'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddFieldWebsiteToCampaignTableSchema extends Schema {
  up () {
    this.table('campaigns', (table) => {
      // alter table
      table.string('website').nullable();
    })
  }

  down () {
    this.table('campaigns', (table) => {
    })
  }
}

module.exports = AddFieldWebsiteToCampaignTableSchema;
