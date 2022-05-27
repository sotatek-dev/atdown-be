'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class WinnerListUser extends Model {
  static get table() {
    return 'winner_list';
  }
}

module.exports = WinnerListUser
