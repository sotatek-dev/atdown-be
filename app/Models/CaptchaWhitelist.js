'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class CaptchaWhitelist extends Model {
  static get table() {
    return 'captcha_whitelists';
  }
}

module.exports = CaptchaWhitelist
