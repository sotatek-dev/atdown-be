'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class RateSetting extends Model {
  static get table() {
    return 'rate_settings';
  }
}

module.exports = RateSetting
