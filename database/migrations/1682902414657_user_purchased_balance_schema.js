'use strict'

/** @type {import('@adonisjs/lucid/src/Schema')} */
const Schema = use('Schema')

class UserPurchasedBalanceSchema extends Schema {
  up () {
    this.create('user_purchased_balance', (table) => {
      table.increments();

      table.integer('campaign_id').unsigned().nullable();
      table.string('wallet_address');
      table.string('user_purchased_amount');

      table.timestamps();
    })
  }

  down () {
    this.drop('user_purchased_balance')
  }
}

module.exports = UserPurchasedBalanceSchema;
