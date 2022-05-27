'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class UserPurchasedBalance extends Model {
  static get table() {
    return 'user_purchased_balance';
  }
}

module.exports = UserPurchasedBalance;
