'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Config extends Model {
  static get table() {
    return 'configs';
  }
}

module.exports = Config
