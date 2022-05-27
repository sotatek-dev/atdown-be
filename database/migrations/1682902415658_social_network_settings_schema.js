'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema');

class SocialNetworkSettingsSchema extends Schema {
  up () {
    this.create('social_network_settings', (table) => {
      table.increments();

      table.integer('campaign_id').unsigned().nullable();
      table.string('twitter_link').nullable();
      table.string('telegram_link').nullable();
      table.string('medium_link').nullable();
      table.string('facebook_link').nullable();

      table.timestamps();
    })
  }

  down () {
    this.drop('social_network_settings')
  }
}

module.exports = SocialNetworkSettingsSchema;
