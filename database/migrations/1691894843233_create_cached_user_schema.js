'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class CreateCachedUserSchema extends Schema {
  up() {
    this.create('cached_users', (table) => {
      table.increments();
      table.integer('user_id');
      table.string('wallet_address');
      table.string('email');
      table.boolean('is_kyc').notNullable().defaultTo(0);

      table.string('user_telegram');
      table.string('user_twitter');

      table.integer('tier');
      table.string('staked_pkf');
      table.string('staked_uni');
      table.string('staked_point');
      table.string('bonus_point');
      table.string('reputation_point');
      table.string('total_point');
      table.timestamps();
    })
  }

  down() {
    this.drop('cached_users')
  }
}

module.exports = CreateCachedUserSchema
