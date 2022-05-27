'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class WhitelistBannerSettingsSchema extends Schema {
  up () {
    this.create('whitelist_banner_settings', (table) => {
      table.increments();

      table.integer('campaign_id').unsigned().nullable();
      table.string('whitelist_link').nullable();
      table.string('guide_link').nullable();
      table.string('announcement_time').nullable();

      table.timestamps();
    })
  }

  down () {
    this.drop('whitelist_banner_settings')
  }
}

module.exports = WhitelistBannerSettingsSchema;
