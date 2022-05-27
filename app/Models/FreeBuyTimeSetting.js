'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class FreeBuyTimeSetting extends Model {
  static get table() {
    return 'free_buy_time_settings';
  }
}

module.exports = FreeBuyTimeSetting;
