'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class RateSettingsSchema extends Schema {
  up () {
    this.create('rate_settings', (table) => {
      table.increments()
      table.string('lp_pkf_rate');
      table.string('spkf_rate');
      table.string('epkf_rate');
      table.timestamps();
    })
  }

  down () {
    this.drop('rate_settings')
  }
}

module.exports = RateSettingsSchema;
