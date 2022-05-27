'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class WhitelistUser extends Model {
  static get table() {
    return 'whitelist_users';
  }

  whitelistSubmission() {
    return this.hasOne('App/Models/WhitelistSubmission', 'id', 'whitelist_user_id')
  }
}

module.exports = WhitelistUser
