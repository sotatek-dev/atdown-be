'use strict'

const { HasMany } = require('@adonisjs/lucid/src/Lucid/Relations');

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class FcfsRoundSettingSchema extends Schema {
  up() {
    this.create('fcfs_round_settings', (table) => {
      table.increments()
      table.integer('campaign_id').unsigned().notNullable();
      table.integer('phase_number').notNullable();
      table.decimal('allocation_bonus', 8, 2).notNullable();
      table.integer('before_buy_end_time').notNullable();
      table.timestamps()
    })
  }

  down() {
    this.drop('fcfs_round_settings')
  }
}

module.exports = FcfsRoundSettingSchema
