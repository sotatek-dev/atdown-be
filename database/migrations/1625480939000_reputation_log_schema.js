'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class ReputationLogSchema extends Schema {
  up () {
    this.create('reputation_logs', (table) => {
      table.increments();
      table.integer('user_id').unsigned();
      table.string('wallet_address', 255).notNullable();
      table.text('staking_history').notNullable();
      table.timestamps();
    })
  }

  down () {
    this.drop('reputation_logs')
  }
}

module.exports = ReputationLogSchema;
