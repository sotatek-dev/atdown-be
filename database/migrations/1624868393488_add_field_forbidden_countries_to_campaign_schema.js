'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddFieldForbiddenCountriesToCampaignSchema extends Schema {
  up() {
    this.table('campaigns', (table) => {
      table.string('forbidden_countries');
    })
  }

  down() {
    this.table('campaigns', (table) => {
      table.dropColumn('forbidden_countries');
    })
  }
}

module.exports = AddFieldForbiddenCountriesToCampaignSchema
