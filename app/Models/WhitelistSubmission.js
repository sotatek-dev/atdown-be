'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class WhitelistSubmission extends Model {
  static get table() {
    return 'whitelist_submissions'
  }
}

module.exports = WhitelistSubmission
