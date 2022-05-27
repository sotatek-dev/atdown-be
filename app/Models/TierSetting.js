'use strict'

/** @type {import('@adonisjs/framework/src/Hash')} */
const Hash = use('Hash')

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class TierSetting extends Model {
  static get table() {
    return 'tier_settings';
  }
}

module.exports = TierSetting
