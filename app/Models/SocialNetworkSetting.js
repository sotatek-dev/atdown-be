'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class SocialNetworkSetting extends Model {
  static get table() {
    return 'social_network_settings';
  }
}

module.exports = SocialNetworkSetting;
