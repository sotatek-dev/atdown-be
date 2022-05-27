'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AddFieldCampaignSchema extends Schema {
  up() {
    this.table('reputation_logs', (table) => {
      table.integer('bonus').unsigned();
    })
  }

  down() {
    this.table('reputation_logs', (table) => {
    })
  }
}

module.exports = AddFieldCampaignSchema
