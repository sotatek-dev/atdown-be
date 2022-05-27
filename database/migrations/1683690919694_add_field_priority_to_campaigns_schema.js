'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddFieldPriorityToCampaignsSchema extends Schema {
  up() {
    this.table('campaigns', (table) => {
      // alter table
      table.string('priority').nullable().default(0);
      table.string('claim_policy').nullable();
    })
  }

  down() {
    this.table('campaigns', (table) => {
      table.dropColumn('priority');
      table.dropColumn('claim_policy');
    })
  }
}

module.exports = AddFieldPriorityToCampaignsSchema
