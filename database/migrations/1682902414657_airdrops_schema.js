'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class AirdropsSchema extends Schema {
  up () {
    this.create('airdrops', (table) => {
      table.increments()
      table.integer('campaign_id').unsigned().nullable();
      table.string('wallet_address');
      table.string('eth_amount');
      table.string('token_amount');
      table.timestamps();
    })
  }

  down () {
    this.drop('airdrops')
  }
}

module.exports = AirdropsSchema;
