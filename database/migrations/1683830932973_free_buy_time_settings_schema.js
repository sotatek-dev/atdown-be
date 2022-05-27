'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')
const Const = use('App/Common/Const')

class FreeBuyTimeSettingSchema extends Schema {
  up() {
    this.create('free_buy_time_settings', (table) => {
      table.increments();

      table.integer('campaign_id').unsigned().nullable();
      table.string('start_buy_time').nullable();
      table.string('max_bonus').nullable();

      table.timestamps();
    })
  }

  down() {
    this.drop('free_buy_time_settings')
  }
}

module.exports = FreeBuyTimeSettingSchema;
