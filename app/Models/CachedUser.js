'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class CachedUser extends Model {
  static get table() {
    return 'cached_users';
  }
}

module.exports = CachedUser;
