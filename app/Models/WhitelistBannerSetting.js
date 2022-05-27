'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class WhitelistBannerSetting extends Model {
  static get table() {
    return 'whitelist_banner_settings';
  }
}

module.exports = WhitelistBannerSetting;
