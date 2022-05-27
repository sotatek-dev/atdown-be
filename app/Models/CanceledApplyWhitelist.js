'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class CanceledApplyWhitelist extends Model {
  static get table() {
    return 'canceled_apply_whitelist';
  }
}

module.exports = CanceledApplyWhitelist;
