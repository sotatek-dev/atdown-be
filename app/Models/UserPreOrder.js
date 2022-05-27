'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class UserPreOrder extends Model {
  static get table() {
    return 'user_pre_orders';
  }
}

module.exports = UserPreOrder;
