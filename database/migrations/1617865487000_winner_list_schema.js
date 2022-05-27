'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class WinnerListSchema extends Schema {
  up () {
    this.create('winner_list', (table) => {
      table.increments();
      table.string('email', 255).nullable();
      table.string('wallet_address', 255).notNullable();
      table.integer('campaign_id').unsigned().notNullable();
      table.integer('level').nullable();
      table.timestamps();
    })
  }

  down () {
    this.drop('winner_list')
  }
}

module.exports = WinnerListSchema
