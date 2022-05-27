'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddFieldKycBypasstoCampaignSchema extends Schema {
  up() {
    this.table('campaigns', (table) => {
      table.boolean('kyc_bypass').notNullable().defaultTo(0);
    })
  }

  down() {
    this.table('campaigns', (table) => {
      // reverse alternations
      table.dropColumn('kyc_bypass');
    })
  }
}

module.exports = AddFieldKycBypasstoCampaignSchema
